import { setup, assign, createActor } from 'xstate'
import type {
  AnimationMachineContext,
  AnimationMachineEvent,
  AnimationTransition,
  InTransitionState,
} from './types'


function computeTotalDuration(t: AnimationTransition): number {
  const kfTotal = (t.keyframes ?? []).reduce((sum, kf) => sum + kf.duration, 0)
  return kfTotal + t.crossFadeDuration
}

export function findTransition(
  transitions: AnimationTransition[],
  from: string,
  to: string,
): AnimationTransition | undefined {
  return transitions.find((t) => t.from === from && t.to === to)
}

function isIdleNode(nodeId: string | undefined): boolean {
  return nodeId === 'idle' || nodeId === undefined
}

function buildTransition(
  ctx: AnimationMachineContext,
  toNodeId: string,
  transitions: AnimationTransition[],
): InTransitionState {
  const tr = findTransition(transitions, ctx.activeNodeId, toNodeId)
  if (!tr) {
    console.warn(`[AnimSM] no transition defined from '${ctx.activeNodeId}' → '${toNodeId}', using direct jump`)
    return {
      fromNodeId: ctx.activeNodeId,
      toNodeId,
      progress: 0,
      elapsed: 0,
      totalDuration: 0,
      crossFadeDuration: 0,
      remainingKeyframes: [],
      reversible: false,
      paused: false,
    }
  }
  return {
    fromNodeId: ctx.activeNodeId,
    toNodeId,
    progress: 0,
    elapsed: 0,
    totalDuration: computeTotalDuration(tr),
    crossFadeDuration: tr.crossFadeDuration,
    remainingKeyframes: [...(tr.keyframes ?? [])],
    reversible: tr.reversible,
    paused: false,
  }
}

function reverseTransition(t: InTransitionState): InTransitionState {
  return {
    ...t,
    fromNodeId: t.toNodeId,
    toNodeId: t.fromNodeId,
    elapsed: t.totalDuration - t.elapsed,
    progress: 1 - t.progress,
    crossFadeDuration: t.crossFadeDuration,
    remainingKeyframes: [],
  }
}


export function buildAnimationMachine(transitions: AnimationTransition[]) {
  return setup({
    types: {
      context: {} as AnimationMachineContext,
      events: {} as AnimationMachineEvent,
      input: {} as { initialNodeId: string },
    },

    guards: {
      isNewEmotion: ({ context, event }) => {
        const e = event as { type: 'EMOTION_SET'; emotion: string }
        return context.activeNodeId !== e.emotion
      },

      canReplace: ({ context, event }) => {
        if (!context.activeTransition) return false
        const e = event as { type: 'EMOTION_SET'; emotion: string }
        const tr = findTransition(transitions, context.activeNodeId, e.emotion)
        return tr?.concurrency === 'replace'
      },

      canReverse: ({ context, event }) => {
        if (!context.activeTransition?.reversible) return false
        const e = event as { type: 'EMOTION_SET'; emotion: string }
        return context.activeTransition.toNodeId === e.emotion
      },

      hasQueuedEmotion: ({ context }) => context.queuedEmotion !== null,

      isToEmote: ({ context }) => !isIdleNode(context.activeTransition?.toNodeId),
    },

    actions: {
      assignRequestedEmotion: assign({
        requestedEmotion: ({ event }) =>
          (event as { type: 'EMOTION_SET'; emotion: string }).emotion,
      }),

      clearRequestedEmotion: assign({ requestedEmotion: null }),

      beginTransitionTo: assign({
        activeTransition: ({ context, event }) => {
          const toNodeId = (event as { type: 'EMOTION_SET'; emotion: string }).emotion
          return buildTransition(context, toNodeId, transitions)
        },
        activeNodeId: ({ context }) => context.activeNodeId,
      }),

      beginTransitionToIdle: assign({
        activeTransition: ({ context }) =>
          buildTransition(context, 'idle', transitions),
      }),

      completeTransition: assign({
        activeNodeId: ({ context }) => context.activeTransition?.toNodeId ?? context.activeNodeId,
        activeTransition: null,
        queuedEmotion: null,
        requestedEmotion: null,
      }),

      popKeyframe: assign({
        activeTransition: ({ context }) => {
          const t = context.activeTransition
          if (!t) return null
          const [, ...rest] = t.remainingKeyframes
          return { ...t, remainingKeyframes: rest }
        },
      }),

      applyReverse: assign({
        activeTransition: ({ context }) =>
          context.activeTransition ? reverseTransition(context.activeTransition) : null,
        requestedEmotion: ({ event }) =>
          (event as { type: 'EMOTION_SET'; emotion: string }).emotion,
      }),

      queueEmotion: assign({
        queuedEmotion: ({ event }) =>
          (event as { type: 'EMOTION_SET'; emotion: string }).emotion,
      }),

      promoteQueuedEmotion: assign({
        requestedEmotion: ({ context }) => context.queuedEmotion,
        queuedEmotion: null,
      }),

      setActiveNodeFromTransition: assign({
        activeNodeId: ({ context }) => context.activeTransition?.toNodeId ?? context.activeNodeId,
      }),
    },
  }).createMachine({
    id: 'vrmAnimation',
    initial: 'loading',

    context: ({ input }) => ({
      activeNodeId: input.initialNodeId,
      requestedEmotion: null,
      activeTransition: null,
      queuedEmotion: null,
    }),

    states: {
      loading: {
        on: {
          CLIP_READY: {
            target: 'idle',
            actions: assign({
              activeNodeId: ({ event }) => event.nodeId,
            }),
          },
        },
      },

      idle: {
        on: {
          EMOTION_SET: {
            guard: 'isNewEmotion',
            target: 'transitioning',
            actions: ['assignRequestedEmotion', 'beginTransitionTo'],
          },
          IDLE_CYCLE_COMPLETE: {
            // SelfTransition: controller fires this; re-enter idle to reset elapsed
            target: 'idle',
            reenter: true,
          },
        },
      },

      transitioning: {
        on: {
          EMOTION_SET: [
            // replace: interrupt and start over toward new target
            {
              guard: 'canReplace',
              target: 'transitioning',
              reenter: true,
              actions: ['assignRequestedEmotion', 'beginTransitionTo'],
            },
            // reverse: flip direction toward the emotion we were coming from
            {
              guard: 'canReverse',
              actions: 'applyReverse',
            },
            // sequence/ignore: queue it (or do nothing if no concurrency match)
            {
              actions: 'queueEmotion',
            },
          ],

          EMOTION_CLEARED: {
            // Abandon emote transition, head back to idle
            target: 'transitioning',
            reenter: true,
            actions: ['clearRequestedEmotion', 'beginTransitionToIdle'],
          },

          KEYFRAME_COMPLETE: {
            actions: 'popKeyframe',
          },

          TRANSITION_COMPLETE: [
            {
              guard: 'isToEmote',
              target: 'emoting',
              actions: 'completeTransition',
            },
            {
              target: 'idle',
              actions: 'completeTransition',
            },
          ],

          PAUSE_TRANSITION: {
            actions: assign({
              activeTransition: ({ context }) =>
                context.activeTransition
                  ? { ...context.activeTransition, paused: true }
                  : null,
            }),
          },

          RESUME_TRANSITION: {
            actions: assign({
              activeTransition: ({ context }) =>
                context.activeTransition
                  ? { ...context.activeTransition, paused: false }
                  : null,
            }),
          },
        },
      },

      emoting: {
        on: {
          EMOTION_SET: [
            {
              guard: 'canReplace',
              target: 'transitioning',
              reenter: true,
              actions: ['assignRequestedEmotion', 'beginTransitionTo'],
            },
            {
              actions: 'queueEmotion',
            },
          ],

          EMOTION_CLEARED: {
            target: 'transitioning',
            actions: ['clearRequestedEmotion', 'beginTransitionToIdle'],
          },

          // Clip near end -> cross-fade back to idle (or queued emotion)
          TRANSITION_COMPLETE: [
            {
              guard: 'hasQueuedEmotion',
              target: 'transitioning',
              actions: ['promoteQueuedEmotion', 'beginTransitionToIdle'],
            },
            {
              target: 'transitioning',
              actions: 'beginTransitionToIdle',
            },
          ],
        },
      },
    },
  })
}


export function createAnimationActor(
  transitions: AnimationTransition[],
  initialNodeId = 'idle',
) {
  const machine = buildAnimationMachine(transitions)
  return createActor(machine, { input: { initialNodeId } })
}

export type AnimationActor = ReturnType<typeof createAnimationActor>
