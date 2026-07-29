import type { AnimationGraphConfig, AnimationNode, AnimationTransition, SelfTransition } from './types'



const EMOTE_IDS = [
  'angry', 'blush', 'happy', 'sad', 'surprised', 'relax', 'sleepy', 'thinking',
  'greeting', 'greeting2', 'hello', 'pose', 'motion_pose', 'peace_sign', 'shoot', 'show_body', 'spin',
] as const
type EmoteId = typeof EMOTE_IDS[number]

export const DEFAULT_NODES: AnimationNode[] = [
  { id: 'idle', looping: true },
  ...EMOTE_IDS.map((id): AnimationNode => ({ id, looping: false })),
]

export const DEFAULT_CLIP_URLS: Record<string, string> = {
  idle:        '/idle/idle_loop.vrma',
  angry:       '/animations/Angry.vrma',
  blush:       '/animations/Blush.vrma',
  happy:       '/animations/Clapping.vrma',
  sad:         '/animations/Sad.vrma',
  surprised:   '/animations/Surprised.vrma',
  relax:       '/animations/Relax.vrma',
  sleepy:      '/animations/Sleepy.vrma',
  thinking:    '/animations/Thinking.vrma',
  greeting:    '/animations/greeting.vrma',
  greeting2:   '/animations/greeting2.vrma',
  hello:       '/animations/hello.vrma',
  pose:        '/animations/model-pose.vrma',
  motion_pose: '/animations/motion_pose.vrma',
  peace_sign:  '/animations/peace-sign.vrma',
  shoot:       '/animations/shoot.vrma',
  show_body:   '/animations/show-full-body.vrma',
  spin:        '/animations/spin.vrma',
}


const idleToEmote = (id: EmoteId): AnimationTransition => ({
  from: 'idle',
  to: id,
  crossFadeDuration: 0.3,
  concurrency: 'replace',
  reversible: id === 'angry',
  keyframes: [],
})

const emoteToIdle = (id: EmoteId): AnimationTransition => ({
  from: id,
  to: 'idle',
  crossFadeDuration: 0.3,
  concurrency: 'replace',
  reversible: false,
  keyframes: [],
})

export const DEFAULT_TRANSITIONS: AnimationTransition[] = [
  ...EMOTE_IDS.map(idleToEmote),
  ...EMOTE_IDS.map(emoteToIdle),
]


export const DEFAULT_SELF_TRANSITIONS: SelfTransition[] = [
  // Example - uncomment and supply a clip URL when breathing_idle.vrma is ready:
  // { nodeId: 'idle', variationClipId: 'breathing_idle', probability: 0.15, crossFadeDuration: 0.3 },
]


export const DEFAULT_GRAPH_CONFIG: AnimationGraphConfig = {
  nodes:           DEFAULT_NODES,
  transitions:     DEFAULT_TRANSITIONS,
  selfTransitions: DEFAULT_SELF_TRANSITIONS,
  clipUrls:        DEFAULT_CLIP_URLS,
}
