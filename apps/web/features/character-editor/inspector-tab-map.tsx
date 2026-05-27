'use client'
import type { ComponentType } from 'react'
import type { HubTabId } from '@/shared/hooks/useHubLayout'
import {
  IconUser, IconBrain, IconMicrophone, IconPaint,
  IconIntegration, IconScene, IconMemory, IconObs,
} from '@/features/character-editor/tab-icons'

import IdentityPage     from '@/features/character-editor/settings/identity-page'
import BrainPage        from '@/features/character-editor/settings/brain-page'
import VoicePage        from '@/features/character-editor/settings/voice-page'
import MemoryPage       from '@/features/character-editor/settings/memory-page'
import SkillsPage       from '@/features/character-editor/settings/skills-page'
import ModelPage        from '@/features/character-editor/settings/model-page'
import ScenePage        from '@/features/character-editor/settings/scene-page'
import ChannelsPage from '@/features/character-editor/settings/channels-page'
import ObsPage          from '@/features/character-editor/settings/obs-page'

export interface InspectorTabDef {
  labelKey: string
  icon: React.ReactNode | null
  Component: ComponentType
}

export const INSPECTOR_TAB_MAP: Record<HubTabId, InspectorTabDef> = {
  profile:    { labelKey: 'profile:tabs.profile.label',    icon: <IconUser />,        Component: IdentityPage    },
  brain:      { labelKey: 'profile:tabs.brain.label',      icon: <IconBrain />,       Component: BrainPage       },
  voice:      { labelKey: 'profile:tabs.voice.label',      icon: <IconMicrophone />,  Component: VoicePage       },
  memory:     { labelKey: 'profile:tabs.memory.label',     icon: <IconMemory />,      Component: MemoryPage      },
  skills:     { labelKey: 'profile:tabs.skills.label',     icon: null,                Component: SkillsPage      },
  avatars:    { labelKey: 'profile:tabs.avatars.label',    icon: <IconPaint />,       Component: ModelPage       },
  scene:      { labelKey: 'profile:tabs.scene.label',      icon: <IconScene />,       Component: ScenePage       },
  connection: { labelKey: 'profile:tabs.connection.label', icon: <IconIntegration />, Component: ChannelsPage },
  obs:        { labelKey: 'profile:tabs.obs.label',        icon: <IconObs />,         Component: ObsPage         },
  emotion:    { labelKey: 'profile:tabs.emotion.label',    icon: null,                Component: () => null      },
}
