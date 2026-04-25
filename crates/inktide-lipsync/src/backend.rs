use crate::error::LipSyncError;
use crate::viseme::VisemeTimeline;

/// Plug-in interface for lip-sync analysis strategies.
///
/// Implement this to add a new backend without touching existing code —
/// Whisper alignment, neural phoneme model, cloud API, whatever.
/// Pass the implementation to [`LipSyncAnalyzer::from_backend`].
pub trait LipSyncBackend: Send + Sync + std::fmt::Debug {
    fn name(&self) -> &str;

    /// Blocking — wraps in `tokio::task::spawn_blocking` if calling from async.
    fn analyze(&self, wav_bytes: &[u8]) -> Result<VisemeTimeline, LipSyncError>;
}
