use thiserror::Error;

/// Errors from lip-sync analysis.
///
/// `#[non_exhaustive]` — match with a `_ =>` catch-all.
#[non_exhaustive]
#[derive(Debug, Error)]
pub enum LipSyncError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Rhubarb process failed: {0}")]
    RhubarbFailed(String),

    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Unknown viseme '{0}'")]
    UnknownViseme(String),

    #[error("WAV decode error: {0}")]
    Wav(#[from] hound::Error),

    #[error("Subprocess timed out after {0:?}")]
    Timeout(std::time::Duration),
}
