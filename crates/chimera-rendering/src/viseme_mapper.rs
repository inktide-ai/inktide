use chimera_lipsync::Viseme;

use crate::vrm_viseme::{viseme_to_weights, BlendShapeWeights};

/// Converts a viseme to avatar blend-shape weights.
///
/// Implement this to target a different avatar format (Live2D, MetaHuman, etc.)
/// without changing the controller. Pass your mapper to [`LipSyncController::with_config`].
pub trait VisemeMapper: Send + Sync + std::fmt::Debug {
    fn viseme_to_weights(&self, viseme: Viseme) -> BlendShapeWeights;
}

/// Default VRM 1.0 mapper.
#[derive(Debug, Clone, Default)]
pub struct VrmVisemeMapper;

impl VisemeMapper for VrmVisemeMapper {
    fn viseme_to_weights(&self, viseme: Viseme) -> BlendShapeWeights {
        viseme_to_weights(viseme)
    }
}
