//! Benchmark for `VisemeTimeline::blend_state`, the function called once per
//! rendered frame on the client to drive avatar mouth animation.
//!
//! Scenario: a single streamed sentence fragment (~3s of speech), viseme cues
//! spaced ~150ms apart (typical Rhubarb output density for continuous speech),
//! queried at 60 FPS positions across the whole fragment - i.e. exactly the
//! access pattern described in the article's condition (3).

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use inktide_lipsync::{Viseme, VisemeCue, VisemeTimeline};
use std::time::Duration;

/// Build a synthetic timeline of `n_cues` visemes evenly spaced across
/// `duration_ms`, cycling through all nine Preston Blair shapes.
fn synthetic_timeline(n_cues: usize, duration_ms: u64) -> VisemeTimeline {
    let shapes = [
        Viseme::X, Viseme::A, Viseme::B, Viseme::C, Viseme::D,
        Viseme::E, Viseme::F, Viseme::G, Viseme::H,
    ];
    let step = duration_ms / n_cues.max(1) as u64;
    let cues = (0..n_cues)
        .map(|i| VisemeCue {
            start: Duration::from_millis(i as u64 * step),
            viseme: shapes[i % shapes.len()],
        })
        .collect();
    VisemeTimeline::new(cues, Duration::from_millis(duration_ms))
}

fn bench_blend_state(c: &mut Criterion) {
    let mut group = c.benchmark_group("blend_state_single_call");

    // ~3s fragment, cue every ~150ms -> 20 cues. Matches typical single-sentence
    // TTS output density observed with Rhubarb on continuous speech.
    let timeline_3s_20cues = synthetic_timeline(20, 3000);

    group.bench_function(BenchmarkId::new("single_call", "20_cues_3s"), |b| {
        b.iter(|| {
            black_box(timeline_3s_20cues.blend_state(black_box(Duration::from_millis(1500))))
        })
    });

    // Longer fragment (~8s, e.g. a longer sentence), 50 cues, to see how the
    // binary search scales with cue count.
    let timeline_8s_50cues = synthetic_timeline(50, 8000);
    group.bench_function(BenchmarkId::new("single_call", "50_cues_8s"), |b| {
        b.iter(|| {
            black_box(timeline_8s_50cues.blend_state(black_box(Duration::from_millis(4000))))
        })
    });

    group.finish();

    // Realistic per-frame access pattern: querying blend_state() at every
    // 60 FPS frame position across the whole 3s fragment (180 calls), which is
    // exactly what the renderer does while a single fragment is playing.
    let mut group2 = c.benchmark_group("blend_state_60fps_playback");
    let timeline = synthetic_timeline(20, 3000);
    let frame_times: Vec<Duration> = (0..180)
        .map(|f| Duration::from_secs_f64(f as f64 / 60.0))
        .collect();

    group2.bench_function("full_3s_fragment_at_60fps", |b| {
        b.iter(|| {
            for t in &frame_times {
                black_box(timeline.blend_state(black_box(*t)));
            }
        })
    });

    group2.finish();
}

criterion_group!(benches, bench_blend_state);
criterion_main!(benches);
