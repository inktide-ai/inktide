use std::path::PathBuf;

use tracing::{info, warn};

use crate::amplitude::{AmplitudeAnalyzer, AmplitudeConfig};
use crate::backend::LipSyncBackend;
use crate::error::LipSyncError;
use crate::rhubarb::{RhubarbAnalyzer, RhubarbConfig, DEFAULT_TIMEOUT};
use crate::viseme::VisemeTimeline;

/// Entry point for lip-sync analysis. Wraps any [`LipSyncBackend`].
///
/// Use the convenience constructors for common cases, or [`from_backend`] to
/// plug in a custom implementation.
#[derive(Debug)]
pub struct LipSyncAnalyzer {
    inner: Box<dyn LipSyncBackend>,
}

impl LipSyncAnalyzer {
    /// Primary extension point - wraps any [`LipSyncBackend`] implementation.
    pub fn from_backend(backend: impl LipSyncBackend + 'static) -> Self {
        Self {
            inner: Box::new(backend),
        }
    }

    /// Probes `$PATH` for `rhubarb`; falls back to amplitude if not found.
    pub fn auto() -> Self {
        match RhubarbAnalyzer::from_path() {
            Some(r) => {
                info!("lipsync: using Rhubarb (phoneme-accurate)");
                Self::from_backend(r)
            }
            None => {
                warn!(
                    "lipsync: `rhubarb` not in PATH, falling back to amplitude. \
                     https://github.com/DanielSWolf/rhubarb-lip-sync"
                );
                Self::from_backend(AmplitudeAnalyzer::with_defaults())
            }
        }
    }

    /// Force Rhubarb at a specific path. Applies [`DEFAULT_TIMEOUT`] as the
    /// subprocess ceiling. For a different value pass a [`RhubarbConfig`] to
    /// [`from_backend`] directly.
    pub fn rhubarb(path: impl Into<PathBuf>) -> Self {
        Self::from_backend(RhubarbAnalyzer::new(RhubarbConfig {
            executable: path.into(),
            timeout: Some(DEFAULT_TIMEOUT),
        }))
    }

    pub fn amplitude() -> Self {
        Self::from_backend(AmplitudeAnalyzer::with_defaults())
    }

    pub fn amplitude_with(config: AmplitudeConfig) -> Self {
        Self::from_backend(AmplitudeAnalyzer::new(config))
    }

    /// Blocking - ~100-500 ms for Rhubarb. Use `spawn_blocking` in async contexts.
    pub fn analyze(&self, wav_bytes: &[u8]) -> Result<VisemeTimeline, LipSyncError> {
        self.inner.analyze(wav_bytes)
    }

    pub fn backend_name(&self) -> &str {
        self.inner.name()
    }
}
