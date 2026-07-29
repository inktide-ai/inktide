//! Lip-sync engine: WAV bytes -> timed viseme sequence for driving VRM blend shapes.
//!
//! ```rust,no_run
//! use inktide_lipsync::LipSyncAnalyzer;
//! use std::time::Duration;
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let wav = std::fs::read("speech.wav")?;
//! let timeline = LipSyncAnalyzer::auto().analyze(&wav)?;
//! let (current, next, progress) = timeline.blend_state(Duration::from_millis(120));
//! # Ok(())
//! # }
//! ```
//!
//! `auto()` picks Rhubarb when it's in `$PATH`, otherwise falls back to amplitude.
//! Implement [`LipSyncBackend`] and use [`LipSyncAnalyzer::from_backend`] to add your own.

mod amplitude;
mod analyzer;
mod backend;
mod error;
mod rhubarb;
mod viseme;

pub use amplitude::{AmplitudeAnalyzer, AmplitudeConfig};
pub use analyzer::LipSyncAnalyzer;
pub use backend::LipSyncBackend;
pub use error::LipSyncError;
pub use rhubarb::{RhubarbAnalyzer, RhubarbConfig};
pub use viseme::{Viseme, VisemeCue, VisemeTimeline};
