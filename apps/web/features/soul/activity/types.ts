export type SoulActivityEventType =
  | 'MOOD_SHIFT'
  | 'APPEARANCE_CHANGE'
  | 'MILESTONE'
  | 'KNOWLEDGE_GAINED'
  | 'PERSONALITY_DRIFT'

interface ActivityEventBase {
  id: string
  occurred_at: string
  emoji: string
  copy: string
}

export interface MoodShiftEvent extends ActivityEventBase {
  event_type: 'MOOD_SHIFT'
}

export interface AppearanceChangeEvent extends ActivityEventBase {
  event_type: 'APPEARANCE_CHANGE'
}

export interface MilestoneEvent extends ActivityEventBase {
  event_type: 'MILESTONE'
}

export interface KnowledgeGainedEvent extends ActivityEventBase {
  event_type: 'KNOWLEDGE_GAINED'
}

export interface PersonalityDriftEvent extends ActivityEventBase {
  event_type: 'PERSONALITY_DRIFT'
}

export type SoulActivityEvent =
  | MoodShiftEvent
  | AppearanceChangeEvent
  | MilestoneEvent
  | KnowledgeGainedEvent
  | PersonalityDriftEvent

export interface SoulActivityFeedPage {
  items: SoulActivityEvent[]
  next_cursor: string | null
}

export interface ActivityDayGroup {
  /** YYYY-MM-DD key used for React keys and label formatting */
  dayKey: string
  events: SoulActivityEvent[]
}
