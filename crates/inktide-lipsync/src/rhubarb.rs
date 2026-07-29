use std::io::{Read as _, Write as _};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;

use serde::Deserialize;
use tempfile::NamedTempFile;
use tracing::{debug, instrument};
use wait_timeout::ChildExt as _;

use crate::backend::LipSyncBackend;
use crate::error::LipSyncError;
use crate::viseme::{Viseme, VisemeCue, VisemeTimeline};

#[derive(Deserialize)]
struct RhubarbOutput {
    metadata: RhubarbMetadata,
    #[serde(rename = "mouthCues")]
    mouth_cues: Vec<RhubarbCue>,
}

#[derive(Deserialize)]
struct RhubarbMetadata { duration: f64 }

#[derive(Deserialize)]
struct RhubarbCue { start: f64, value: String }

/// Default Rhubarb subprocess timeout, aligned with the Inktide <=4 s end-to-end
/// latency budget. Rhubarb normally finishes in 100-500 ms; this allows an 8-40x
/// margin before the process is killed. Used by [`RhubarbAnalyzer::from_path`] and
/// [`LipSyncAnalyzer::rhubarb`].
pub const DEFAULT_TIMEOUT: Duration = Duration::from_secs(4);

#[derive(Debug, Clone)]
pub struct RhubarbConfig {
    pub executable: PathBuf,
    /// `None` waits indefinitely. Set to match your pipeline latency budget.
    /// See [`DEFAULT_TIMEOUT`] for the recommended value.
    pub timeout: Option<Duration>,
}

/// Phoneme-accurate lip-sync via the Rhubarb Lip Sync subprocess.
#[derive(Debug, Clone)]
pub struct RhubarbAnalyzer {
    config: RhubarbConfig,
}

impl RhubarbAnalyzer {
    pub fn new(config: RhubarbConfig) -> Self { Self { config } }

    pub fn from_path() -> Option<Self> {
        which::which("rhubarb").ok().map(|exe| {
            Self::new(RhubarbConfig {
                executable: exe,
                timeout: Some(DEFAULT_TIMEOUT),
            })
        })
    }
}

impl LipSyncBackend for RhubarbAnalyzer {
    fn name(&self) -> &str { "rhubarb" }

    #[instrument(skip(self, wav_bytes), fields(bytes = wav_bytes.len()))]
    fn analyze(&self, wav_bytes: &[u8]) -> Result<VisemeTimeline, LipSyncError> {
        let tmp = write_temp_wav(wav_bytes)?;
        let stdout = self.run_rhubarb(tmp.path())?;
        parse_output(&stdout)
    }
}

impl RhubarbAnalyzer {
    fn run_rhubarb(&self, wav_path: &std::path::Path) -> Result<Vec<u8>, LipSyncError> {
        debug!(executable = ?self.config.executable, path = ?wav_path, "spawning rhubarb");

        let mut child = Command::new(&self.config.executable)
            .args(["--machineReadable", "-f", "json"])
            .arg(wav_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(LipSyncError::Io)?;

        // Drain pipes on background threads - without this, a large JSON output
        // can fill the OS pipe buffer while we're blocked in wait(), deadlocking both sides.
        let stdout_t = child.stdout.take().map(|out| {
            std::thread::spawn(move || {
                let mut out = out;
                let mut buf = Vec::new();
                let _ = out.read_to_end(&mut buf);
                buf
            })
        });
        let stderr_t = child.stderr.take().map(|err| {
            std::thread::spawn(move || {
                let mut err = err;
                let mut buf = String::new();
                let _ = err.read_to_string(&mut buf);
                buf
            })
        });

        let status = match self.config.timeout {
            None => child.wait().map_err(LipSyncError::Io)?,
            Some(t) => {
                let Some(status) = child.wait_timeout(t).map_err(LipSyncError::Io)? else {
                    let _ = child.kill();
                    // join draining threads before returning so we don't leak them
                    let _ = stdout_t.and_then(|h| h.join().ok());
                    let _ = stderr_t.and_then(|h| h.join().ok());
                    return Err(LipSyncError::Timeout(t));
                };
                status
            }
        };

        let stdout = stdout_t.and_then(|h| h.join().ok()).unwrap_or_default();
        let stderr = stderr_t.and_then(|h| h.join().ok()).unwrap_or_default();

        if !status.success() {
            return Err(LipSyncError::RhubarbFailed(stderr));
        }

        Ok(stdout)
    }
}

fn write_temp_wav(wav_bytes: &[u8]) -> Result<NamedTempFile, LipSyncError> {
    let mut tmp = NamedTempFile::with_suffix(".wav").map_err(LipSyncError::Io)?;
    tmp.write_all(wav_bytes).map_err(LipSyncError::Io)?;
    tmp.flush().map_err(LipSyncError::Io)?;
    Ok(tmp)
}

fn checked_secs(secs: f64, context: &str) -> Result<Duration, LipSyncError> {
    if secs < 0.0 || !secs.is_finite() {
        return Err(LipSyncError::RhubarbFailed(format!("invalid {context}: {secs}")));
    }
    Ok(Duration::from_secs_f64(secs))
}

fn parse_output(stdout: &[u8]) -> Result<VisemeTimeline, LipSyncError> {
    let parsed: RhubarbOutput = serde_json::from_slice(stdout).map_err(LipSyncError::Json)?;

    let cues = parsed.mouth_cues.iter()
        .map(|c| Ok(VisemeCue {
            start: checked_secs(c.start, "cue timestamp")?,
            viseme: Viseme::try_from(c.value.as_str())?,
        }))
        .collect::<Result<Vec<_>, LipSyncError>>()?;

    Ok(VisemeTimeline::new(
        cues,
        checked_secs(parsed.metadata.duration, "duration")?,
    ))
}
