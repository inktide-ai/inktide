use std::time::Duration;

use chimera_lipsync::VisemeTimeline;

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
        let t = if raw < self.config.blend_start {
            0.0
        } else {
            ease_in_out((raw - self.config.blend_start) / (1.0 - self.config.blend_start))
        };

        self.mapper.viseme_to_weights(current).lerp(&self.mapper.viseme_to_weights(next), t)
    }

    pub fn duration(&self) -> Duration { self.timeline.duration }

    pub fn is_finished(&self, playback_time: Duration) -> bool {
        playback_time >= self.timeline.duration
    }
}

/// Cubic Hermite S-curve. Exported for reuse in animation code.
pub fn ease_in_out(t: f32) -> f32 { t * t * (3.0 - 2.0 * t) }

#[cfg(test)]
mod tests {
    use super::*;
    use chimera_lipsync::{Viseme, VisemeCue, VisemeTimeline};
    use crate::vrm_viseme::shape;

    fn make_controller() -> LipSyncController {
        LipSyncController::new(VisemeTimeline {
            cues: vec![
                VisemeCue { start: Duration::ZERO, viseme: Viseme::X },
                VisemeCue { start: Duration::from_millis(200), viseme: Viseme::E },
                VisemeCue { start: Duration::from_millis(600), viseme: Viseme::X },
            ],
            duration: Duration::from_millis(800),
        })
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
        let timeline = VisemeTimeline {
            cues: vec![
                VisemeCue { start: Duration::ZERO, viseme: Viseme::X },
                VisemeCue { start: Duration::from_millis(100), viseme: Viseme::E },
            ],
            duration: Duration::from_millis(200),
        };
        let c = LipSyncController::with_config(
            timeline, ControllerConfig { blend_start: 0.0 }, VrmVisemeMapper,
        );
        // blend_start=0 means blending starts immediately, so aa must already be > 0
        assert!(c.weights_at(Duration::from_millis(50)).get(shape::AA) > 0.0);
    }
}
