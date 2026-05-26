use std::time::Duration;

use inktide_lipsync::VisemeTimeline;

use crate::viseme_mapper::{VisemeMapper, VrmVisemeMapper};
use crate::vrm_viseme::BlendShapeWeights;

/// Blend-smoothing parameters.
#[derive(Debug, Clone)]
pub struct ControllerConfig {
    /// When (as a fraction of each cue's duration) to start blending to the next shape.
    /// 0.70 = hold for 70%, blend for the last 30%. Lower = softer, higher = crisper.
    pub blend_start: f32,
}

impl Default for ControllerConfig {
    fn default() -> Self { Self { blend_start: 0.70 } }
}

/// Drives avatar lip blend shapes from a [`VisemeTimeline`].
///
/// Generic over `M: VisemeMapper` (defaults to [`VrmVisemeMapper`]), so you can
/// swap in a different avatar format without changing anything here.
#[derive(Debug)]
pub struct LipSyncController<M: VisemeMapper = VrmVisemeMapper> {
    timeline: VisemeTimeline,
    config: ControllerConfig,
    mapper: M,
}

impl LipSyncController<VrmVisemeMapper> {
    pub fn new(timeline: VisemeTimeline) -> Self {
        Self::with_config(timeline, ControllerConfig::default(), VrmVisemeMapper)
    }
}

impl<M: VisemeMapper> LipSyncController<M> {
    pub fn with_config(timeline: VisemeTimeline, config: ControllerConfig, mapper: M) -> Self {
        Self { timeline, config, mapper }
    }

    /// Returns blend weights for `playback_time`. Call once per render frame.
    pub fn weights_at(&self, playback_time: Duration) -> BlendShapeWeights {
        let (current, next, raw) = self.timeline.blend_state(playback_time);

        // Hold the current pose for `blend_start` fraction, then ease into next.
        // Guard: if blend_start >= 1.0 the denominator would be zero → NaN.
        // Treat it as "never blend" (hold the current pose for the full cue duration).
        let t = if raw < self.config.blend_start || self.config.blend_start >= 1.0 {
            0.0
        } else {
            ease_in_out((raw - self.config.blend_start) / (1.0 - self.config.blend_start))
        };

        let current_weights = self.mapper.viseme_to_weights(current);
        if t == 0.0 {
            // Hold phase: lerp(_, 0.0) == self, so skip the second allocation entirely.
            return current_weights;
        }
        current_weights.lerp(&self.mapper.viseme_to_weights(next), t)
    }

    pub fn duration(&self) -> Duration { self.timeline.duration() }

    pub fn is_finished(&self, playback_time: Duration) -> bool {
        playback_time >= self.timeline.duration()
    }
}

pub(crate) fn ease_in_out(t: f32) -> f32 { t * t * (3.0 - 2.0 * t) }

#[cfg(test)]
mod tests {
    use super::*;
    use inktide_lipsync::{Viseme, VisemeCue, VisemeTimeline};
    use crate::vrm_viseme::shape;

    fn make_controller() -> LipSyncController {
        LipSyncController::new(VisemeTimeline::new(
            vec![
                VisemeCue { start: Duration::ZERO, viseme: Viseme::X },
                VisemeCue { start: Duration::from_millis(200), viseme: Viseme::E },
                VisemeCue { start: Duration::from_millis(600), viseme: Viseme::X },
            ],
            Duration::from_millis(800),
        ))
    }

    #[test]
    fn silence_at_start() {
        assert!(make_controller().weights_at(Duration::ZERO).is_empty());
    }

    #[test]
    fn open_vowel_in_middle() {
        let w = make_controller().weights_at(Duration::from_millis(400));
        assert!(w.get(shape::AA) > 0.0);
    }

    #[test]
    fn finished_after_duration() {
        let c = make_controller();
        assert!(c.is_finished(Duration::from_millis(900)));
        assert!(!c.is_finished(Duration::from_millis(400)));
    }

    #[test]
    fn custom_blend_start() {
        let timeline = VisemeTimeline::new(
            vec![
                VisemeCue { start: Duration::ZERO, viseme: Viseme::X },
                VisemeCue { start: Duration::from_millis(100), viseme: Viseme::E },
            ],
            Duration::from_millis(200),
        );
        let c = LipSyncController::with_config(
            timeline, ControllerConfig { blend_start: 0.0 }, VrmVisemeMapper,
        );
        // blend_start=0 means blending starts immediately, so aa must already be > 0
        assert!(c.weights_at(Duration::from_millis(50)).get(shape::AA) > 0.0);
    }

    #[test]
    fn blend_start_one_does_not_produce_nan() {
        // blend_start = 1.0 used to produce 0.0/0.0 = NaN at end-of-timeline.
        // It should be treated as "never blend" (hold current pose for full cue).
        let timeline = VisemeTimeline::new(
            vec![
                VisemeCue { start: Duration::ZERO, viseme: Viseme::X },
                VisemeCue { start: Duration::from_millis(100), viseme: Viseme::E },
            ],
            Duration::from_millis(200),
        );
        let c = LipSyncController::with_config(
            timeline, ControllerConfig { blend_start: 1.0 }, VrmVisemeMapper,
        );
        // At end-of-timeline raw==1.0 previously caused NaN → all weights drop to zero.
        // With the guard, weights are deterministic (current cue held, no blend).
        let w = c.weights_at(Duration::from_millis(200));
        for (_, v) in w.iter() {
            assert!(v.is_finite(), "weight must not be NaN or Inf");
        }
    }

    #[test]
    fn hold_phase_weights_equal_current_viseme() {
        // During the hold phase (t == 0.0), weights_at must return exactly
        // viseme_to_weights(current) — no lerp artifacts, no extra allocations.
        let timeline = VisemeTimeline::new(
            vec![
                VisemeCue { start: Duration::ZERO, viseme: Viseme::E },
                VisemeCue { start: Duration::from_millis(500), viseme: Viseme::X },
            ],
            Duration::from_millis(600),
        );
        // blend_start=0.70 → hold for first 70% of the cue (0–350 ms)
        let c = LipSyncController::new(timeline);
        let hold_weights = c.weights_at(Duration::from_millis(100)); // well inside hold phase
        let expected = VrmVisemeMapper.viseme_to_weights(Viseme::E);
        for k in [shape::AA, shape::OH, shape::EE, shape::IH, shape::PP] {
            assert!(
                (hold_weights.get(k) - expected.get(k)).abs() < 1e-6,
                "hold phase: shape '{k}' mismatch — got {}, expected {}",
                hold_weights.get(k), expected.get(k)
            );
        }
    }
}
