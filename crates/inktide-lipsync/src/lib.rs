//! Lip-sync engine: WAV bytes → timed viseme sequence for driving VRM blend shapes.
//!
//! ```rust,no_run
//! use inktide_lipsync::LipSyncAnalyzer;
//! use std::time::Duration;
//!
//! let wav = std::fs::read("speech.wav").unwrap();
//! let timeline = LipSyncAnalyzer::auto().analyze(&wav).unwrap();
//! let (current, next, progress) = timeline.blend_state(Duration::from_millis(120));
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

pub use analyzer::LipSyncAnalyzer;
pub use backend::LipSyncBackend;
pub use error::LipSyncError;
pub use viseme::{Viseme, VisemeCue, VisemeTimeline};
pub use amplitude::{AmplitudeAnalyzer, AmplitudeConfig};
pub use rhubarb::{RhubarbAnalyzer, RhubarbConfig};
