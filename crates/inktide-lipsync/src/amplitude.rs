use std::io::Cursor;
use std::time::Duration;

use hound::WavReader;
use tracing::debug;

use crate::backend::LipSyncBackend;
use crate::error::LipSyncError;
use crate::viseme::{Viseme, VisemeCue, VisemeTimeline};

/// Tuning knobs for [`AmplitudeAnalyzer`].
#[derive(Debug, Clone)]
pub struct AmplitudeConfig {
    /// Frame length in ms. 20 ms is standard for speech; go shorter for finer
    /// timing, longer to reduce noise on quiet recordings.
    pub frame_ms: f64,
    pub silence_rms: f32,
    /// Three ascending RMS ceilings: below[0] -> A, below[1] -> D, below[2] -> B, else -> E.
    pub rms_thresholds: [f32; 3],
}

impl Default for AmplitudeConfig {
    fn default() -> Self {
        Self {
            frame_ms: 20.0,
            silence_rms: 0.01,
            rms_thresholds: [0.04, 0.10, 0.20],
        }
    }
}

/// Amplitude-only fallback - no external binary needed.
///
/// Coarse but convincing jaw animation driven purely by loudness.
/// Use [`AmplitudeAnalyzer::with_defaults`] unless you need to tune thresholds.
#[derive(Debug, Clone)]
pub struct AmplitudeAnalyzer {
    config: AmplitudeConfig,
}

impl AmplitudeAnalyzer {
    pub fn new(config: AmplitudeConfig) -> Self {
        Self { config }
    }
    pub fn with_defaults() -> Self {
        Self::new(AmplitudeConfig::default())
    }
    pub fn config(&self) -> &AmplitudeConfig {
        &self.config
    }
}

impl LipSyncBackend for AmplitudeAnalyzer {
    fn name(&self) -> &str {
        "amplitude"
    }

    fn analyze(&self, wav_bytes: &[u8]) -> Result<VisemeTimeline, LipSyncError> {
        let cursor = Cursor::new(wav_bytes);
        let mut reader = WavReader::new(cursor).map_err(LipSyncError::Wav)?;
        let spec = reader.spec();

        let sample_rate = spec.sample_rate as f64;
        let channels = spec.channels as usize;
        // hound returns interleaved samples (L/R/L/R...), so chunk boundaries must
        // span all channels. `mono_frame` is the per-channel frame count; `frame_size`
        // is its interleaved equivalent used for hound chunking only.
        let mono_frame = ((sample_rate * self.config.frame_ms / 1000.0) as usize).max(1);
        let frame_size = mono_frame * channels;
        let samples = decode_samples(&mut reader, spec)?;

        debug!(
            sample_rate,
            channels,
            mono_frame,
            frame_size,
            total = samples.len(),
            "amplitude analysis"
        );

        let mut cues: Vec<VisemeCue> = Vec::new();
        for (i, chunk) in samples.chunks(frame_size).enumerate() {
            let rms = (chunk.iter().map(|s| s * s).sum::<f32>() / chunk.len() as f32).sqrt();
            let viseme = self.rms_to_viseme(rms);
            // Timing uses mono_frame directly - no channel arithmetic needed here.
            let start = Duration::from_secs_f64(i as f64 * mono_frame as f64 / sample_rate);

            if cues.last().is_none_or(|c: &VisemeCue| c.viseme != viseme) {
                cues.push(VisemeCue { start, viseme });
            }
        }

        Ok(VisemeTimeline::new(
            cues,
            // Total interleaved samples / (sample_rate x channels) = actual duration.
            Duration::from_secs_f64(samples.len() as f64 / (sample_rate * channels as f64)),
        ))
    }
}

impl AmplitudeAnalyzer {
    fn rms_to_viseme(&self, rms: f32) -> Viseme {
        let [t0, t1, t2] = self.config.rms_thresholds;
        if rms < self.config.silence_rms {
            Viseme::X
        } else if rms < t0 {
            Viseme::A
        } else if rms < t1 {
            Viseme::D
        } else if rms < t2 {
            Viseme::B
        } else {
            Viseme::E
        }
    }
}

fn decode_samples(
    reader: &mut WavReader<Cursor<&[u8]>>,
    spec: hound::WavSpec,
) -> Result<Vec<f32>, LipSyncError> {
    match spec.sample_format {
        hound::SampleFormat::Float => reader
            .samples::<f32>()
            .map(|s| s.map_err(LipSyncError::Wav))
            .collect(),
        hound::SampleFormat::Int => {
            let max = (1i64 << (spec.bits_per_sample - 1)) as f32;
            reader
                .samples::<i32>()
                .map(|s| s.map(|v| v as f32 / max).map_err(LipSyncError::Wav))
                .collect()
        }
    }
}
