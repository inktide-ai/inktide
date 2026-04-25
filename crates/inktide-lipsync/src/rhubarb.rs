use std::io::Write as _;
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

#[derive(Debug, Clone)]
pub struct RhubarbConfig {
    pub executable: PathBuf,
    /// `None` waits indefinitely. Recommended: `Some(Duration::from_secs(30))`.
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
            Self::new(RhubarbConfig { executable: exe, timeout: None })
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

        // Drain pipes on background threads — without this, a large JSON output
        // can fill the OS pipe buffer while we're blocked in wait(), deadlocking both sides.
        let stdout_t = child.stdout.take().map(|out| {
            std::thread::spawn(move || {
                let mut buf = Vec::new();
                let _ = std::io::Read::read_to_end(&mut { out }, &mut buf);
                buf
            })
        });
        let stderr_t = child.stderr.take().map(|err| {
            std::thread::spawn(move || {
                let mut buf = String::new();
                let _ = std::io::Read::read_to_string(&mut { err }, &mut buf);
                buf
            })
        });

        let status = match self.config.timeout {
            None => Some(child.wait().map_err(LipSyncError::Io)?),
            Some(t) => {
                let s = child.wait_timeout(t).map_err(LipSyncError::Io)?;
                if s.is_none() { let _ = child.kill(); }
                s
            }
        };

        let stdout = stdout_t.and_then(|h| h.join().ok()).unwrap_or_default();
        let stderr = stderr_t.and_then(|h| h.join().ok()).unwrap_or_default();

        let Some(status) = status else {
            return Err(LipSyncError::Timeout(self.config.timeout.unwrap_or(Duration::ZERO)));
        };

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

fn parse_output(stdout: &[u8]) -> Result<VisemeTimeline, LipSyncError> {
    let parsed: RhubarbOutput = serde_json::from_slice(stdout).map_err(LipSyncError::Json)?;

    let cues = parsed.mouth_cues.iter()
        .map(|c| Ok(VisemeCue {
            start: Duration::from_secs_f64(c.start),
            viseme: Viseme::try_from(c.value.as_str())?,
        }))
        .collect::<Result<Vec<_>, LipSyncError>>()?;

    Ok(VisemeTimeline {
        duration: Duration::from_secs_f64(parsed.metadata.duration),
        cues,
    })
}
