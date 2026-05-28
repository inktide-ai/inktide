// ── Settings pages ─────────────────────────────────────────────────────────────
export { default as BrainPage }    from './settings/brain-page'
export { default as ChannelsPage } from './settings/channels-page'
export { default as IdentityPage } from './settings/identity-page'
export { default as MemoryPage }   from './settings/memory-page'
export { default as ModelPage }    from './settings/model-page'
export { default as ObsPage }      from './settings/obs-page'
export { default as ScenePage }    from './settings/scene-page'
export { default as SkillsPage }   from './settings/skills-page'
export { default as VoicePage }    from './settings/voice-page'
export { default as SettingsHubPage }  from './settings-hub-page'
export { default as CharacterHubPage } from './character-hub-page'

// ── Tab components ─────────────────────────────────────────────────────────────
export { default as BehaviorTab } from './tabs/behavior-tab'
export { default as ChannelTab }  from './tabs/channel-tab'
export { default as ModelTab }    from './tabs/model-tab'

// ── Shared components and utilities ───────────────────────────────────────────
export { FeaturedIntegrations } from './featured-integrations'
export { NewSceneModal }        from './tabs/new-scene-modal'
export { PRESET_SCENES }        from './tabs/preset-scene-card'
export type { PresetScene }     from './tabs/preset-scene-card'
export {
  getEffectiveTagLabel,
  getSceneDisplayTitle,
  BUILTIN_SCENE_TAGS,
} from './tabs/scene-tag-utils'
