use std::time::Duration;
use serde::{Deserialize, Serialize};

use crate::error::LipSyncError;

/// Rhubarb / Preston Blair mouth shapes.
///
/// ```text
/// X — rest    A — P/B/M    B — K/G/NG   C — CH/SH/ZH
/// D — E/I     E — A/O      F — F/V      G — TH/DH    H — L/D/N
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Viseme { X, A, B, C, D, E, F, G, H }

impl TryFrom<&str> for Viseme {
    type Error = LipSyncError;

    fn try_from(s: &str) -> Result<Self, Self::Error> {
        match s {
            "X" => Ok(Self::X), "A" => Ok(Self::A), "B" => Ok(Self::B),
            "C" => Ok(Self::C), "D" => Ok(Self::D), "E" => Ok(Self::E),
            "F" => Ok(Self::F), "G" => Ok(Self::G), "H" => Ok(Self::H),
            other => Err(LipSyncError::UnknownViseme(other.to_owned())),
        }
    }
}

impl Viseme {
    #[deprecated(since = "0.2.0", note = "use `Viseme::try_from(s)` instead")]
    pub fn from_rhubarb(s: &str) -> Option<Self> { Self::try_from(s).ok() }
}

// Serde uses { secs, nanos } for Duration by default — useless on the wire.
// These helpers produce a plain millisecond f64 that the frontend can use directly.
mod duration_ms {
    use serde::{Deserializer, Serializer};
    use std::time::Duration;

    pub fn serialize<S: Serializer>(d: &Duration, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_f64(d.as_secs_f64() * 1_000.0)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Duration, D::Error> {
        let ms = <f64 as serde::Deserialize>::deserialize(d)?;
        Ok(Duration::from_secs_f64(ms / 1_000.0))
    }
}

/// A single cue: viseme is active from `start` until the next cue.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisemeCue {
    #[serde(rename = "startMs", with = "duration_ms")]
    pub start: Duration,
    pub viseme: Viseme,
}

/// Complete lip-sync timeline for one audio chunk.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisemeTimeline {
    pub cues: Vec<VisemeCue>,
    #[serde(rename = "durationMs", with = "duration_ms")]
    pub duration: Duration,
}

impl VisemeTimeline {
    /// Returns `(current, next, progress)` at `time`, where `progress` ∈ [0, 1]
    /// is how far through the current cue we are. Used by the renderer to blend.
    pub fn blend_state(&self, time: Duration) -> (Viseme, Viseme, f32) {
        if self.cues.is_empty() {
            return (Viseme::X, Viseme::X, 0.0);
        }

        let idx = self.cues.partition_point(|c| c.start <= time).saturating_sub(1);
        let current = self.cues[idx].viseme;
        let next_cue = self.cues.get(idx + 1);
        let next = next_cue.map_or(Viseme::X, |c| c.viseme);

        let progress = match next_cue {
            None => 1.0,
            Some(nxt) => {
                let span = nxt.start.saturating_sub(self.cues[idx].start);
                if span.is_zero() {
                    0.0
                } else {
                    let elapsed = time.saturating_sub(self.cues[idx].start);
                    (elapsed.as_secs_f32() / span.as_secs_f32()).clamp(0.0, 1.0)
                }
            }
        };

        (current, next, progress)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn timeline() -> VisemeTimeline {
        VisemeTimeline {
            cues: vec![
                VisemeCue { start: Duration::ZERO, viseme: Viseme::X },
                VisemeCue { start: Duration::from_millis(100), viseme: Viseme::E },
                VisemeCue { start: Duration::from_millis(300), viseme: Viseme::X },
            ],
            duration: Duration::from_millis(500),
        }
    }

    #[test]
    fn blend_state_at_start() {
        let (cur, nxt, p) = timeline().blend_state(Duration::ZERO);
        assert_eq!(cur, Viseme::X);
        assert_eq!(nxt, Viseme::E);
        assert_eq!(p, 0.0);
    }

    #[test]
    fn blend_state_midway() {
        let (cur, nxt, p) = timeline().blend_state(Duration::from_millis(200));
        assert_eq!(cur, Viseme::E);
        assert_eq!(nxt, Viseme::X);
        assert!((p - 0.5).abs() < 0.01);
    }

    #[test]
    fn blend_state_past_end() {
        let (cur, _, _) = timeline().blend_state(Duration::from_millis(400));
        assert_eq!(cur, Viseme::X);
    }

    #[test]
    fn try_from_all_valid() {
        for s in ["X", "A", "B", "C", "D", "E", "F", "G", "H"] {
            assert!(Viseme::try_from(s).is_ok());
        }
    }

    #[test]
    fn try_from_invalid_returns_err() {
        assert!(matches!(Viseme::try_from("Z"), Err(LipSyncError::UnknownViseme(s)) if s == "Z"));
    }

    #[test]
    fn viseme_cue_serialises_to_start_ms() {
        let cue = VisemeCue { start: Duration::from_millis(120), viseme: Viseme::E };
        let json = serde_json::to_string(&cue).unwrap();
        assert!(json.contains("startMs") && json.contains("120"));
    }
}
