//! Avatar rendering control — bridges [`VisemeTimeline`] to blend-shape weights.
//!
//! Swap the mapper to target any avatar format:
//!
//! ```rust,no_run
//! use inktide_lipsync::Viseme;
//! use inktide_rendering::{BlendShapeWeights, ControllerConfig, LipSyncController, VisemeMapper};
//!
//! #[derive(Debug)]
//! struct Live2DMapper;
//!
//! impl VisemeMapper for Live2DMapper {
//!     fn viseme_to_weights(&self, _: Viseme) -> BlendShapeWeights { BlendShapeWeights::new() }
//! }
//!
//! # let timeline = todo!();
//! let controller = LipSyncController::with_config(timeline, ControllerConfig::default(), Live2DMapper);
//! ```

mod lipsync_controller;
mod viseme_mapper;
mod vrm_viseme;

pub use lipsync_controller::{ease_in_out, ControllerConfig, LipSyncController};
pub use viseme_mapper::{VisemeMapper, VrmVisemeMapper};
pub use vrm_viseme::{shape, viseme_to_weights, BlendShapeWeights};

#[allow(deprecated)]
pub use vrm_viseme::lerp_weights;
