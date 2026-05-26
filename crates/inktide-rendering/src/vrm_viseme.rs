use std::collections::HashMap;

use inktide_lipsync::Viseme;

/// VRM 1.0 expression name constants — all lowercase per spec.
pub mod shape {
    pub const AA: &str = "aa"; // open vowel
    pub const IH: &str = "ih"; // front mid
    pub const OU: &str = "ou"; // rounded close
    pub const EE: &str = "ee"; // front close
    pub const OH: &str = "oh"; // back mid
    pub const PP: &str = "pp"; // bilabial — P, B, M
    pub const FF: &str = "ff"; // labiodental — F, V
    pub const TH: &str = "th"; // dental — TH, DH
    pub const DD: &str = "dd"; // alveolar — D, L, N
    pub const KK: &str = "kk"; // velar — K, G, NG
    pub const CH: &str = "ch"; // sibilant — CH, SH, ZH
    pub const SS: &str = "ss"; // fricative — S, Z
    pub const NN: &str = "nn"; // nasal — N, NG
}

/// Per-shape blend weights in [0.0, 1.0]. Absent keys are treated as 0 by the renderer.
#[derive(Debug, Clone, Default)]
pub struct BlendShapeWeights(HashMap<&'static str, f32>);

impl BlendShapeWeights {
    pub fn new() -> Self { Self::default() }

    /// Inserts `weight` clamped to [0, 1]. Values below 1e-4 are dropped.
    pub fn set(&mut self, key: &'static str, weight: f32) {
        let v = weight.clamp(0.0, 1.0);
        if v > 1e-4 { self.0.insert(key, v); } else { self.0.remove(key); }
    }

    pub fn get(&self, key: &'static str) -> f32 {
        self.0.get(key).copied().unwrap_or(0.0)
    }

    pub fn is_empty(&self) -> bool { self.0.is_empty() }

    pub fn iter(&self) -> impl Iterator<Item = (&'static str, f32)> + '_ {
        self.0.iter().map(|(&k, &v)| (k, v))
    }

    /// Linear interpolation toward `other` by `t ∈ [0, 1]`. Absent keys treated as 0.
    pub fn lerp(&self, other: &Self, t: f32) -> Self {
        let mut out = Self::new();
        for (k, va) in self.iter() {
            out.set(k, va + (other.get(k) - va) * t);
        }
        for (k, vb) in other.iter() {
            if !self.0.contains_key(k) {
                out.set(k, vb * t);
            }
        }
        out
    }
}

/// Maps a Rhubarb viseme to VRM 1.0 blend shape weights.
///
/// The TypeScript counterpart (`VISEME_WEIGHTS` in `useLipSync.ts`) is derived
/// from this table — keep them in sync when adjusting weights.
pub(crate) fn viseme_to_weights(viseme: Viseme) -> BlendShapeWeights {
    let mut w = BlendShapeWeights::new();
    match viseme {
        Viseme::X => {}
        Viseme::A => { w.set(shape::PP, 1.0); }
        Viseme::B => { w.set(shape::KK, 1.0); }
        Viseme::C => { w.set(shape::CH, 0.8); w.set(shape::EE, 0.2); }
        Viseme::D => { w.set(shape::EE, 0.9); w.set(shape::IH, 0.1); }
        Viseme::E => { w.set(shape::AA, 0.7); w.set(shape::OH, 0.3); }
        Viseme::F => { w.set(shape::FF, 1.0); }
        Viseme::G => { w.set(shape::TH, 1.0); }
        Viseme::H => { w.set(shape::DD, 0.65); w.set(shape::NN, 0.35); }
    }
    w
}

#[deprecated(since = "0.2.0", note = "use `BlendShapeWeights::lerp` instead")]
pub fn lerp_weights(a: &BlendShapeWeights, b: &BlendShapeWeights, t: f32) -> BlendShapeWeights {
    a.lerp(b, t)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn silence_produces_empty_weights() {
        assert!(viseme_to_weights(Viseme::X).is_empty());
    }

    #[test]
    fn lerp_midpoint() {
        let a = viseme_to_weights(Viseme::X);
        let b = viseme_to_weights(Viseme::E); // aa=0.7, oh=0.3
        let mid = a.lerp(&b, 0.5);
        assert!((mid.get(shape::AA) - 0.35).abs() < 1e-4);
        assert!((mid.get(shape::OH) - 0.15).abs() < 1e-4);
    }

    #[test]
    fn all_shape_constants_are_lowercase() {
        for (name, val) in [
            ("AA", shape::AA), ("IH", shape::IH), ("OU", shape::OU),
            ("EE", shape::EE), ("OH", shape::OH), ("PP", shape::PP),
            ("FF", shape::FF), ("TH", shape::TH), ("DD", shape::DD),
            ("KK", shape::KK), ("CH", shape::CH), ("SS", shape::SS),
            ("NN", shape::NN),
        ] {
            assert!(
                val.chars().all(|c| !c.is_uppercase()),
                "shape::{name} = '{val}' has uppercase chars"
            );
        }
    }

    #[test]
    fn blend_shape_weights_clamps() {
        let mut w = BlendShapeWeights::new();
        w.set(shape::AA, 1.5);
        assert!((w.get(shape::AA) - 1.0).abs() < 1e-6);
        w.set(shape::AA, -0.5);
        assert_eq!(w.get(shape::AA), 0.0);
    }
}
