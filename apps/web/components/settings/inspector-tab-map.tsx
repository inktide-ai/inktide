'use client'
import type { ComponentType } from 'react'
import type { HubTabId } from '@/hooks/useHubLayout'
import {
  IconUser, IconBrain, IconMicrophone, IconPaint,
  IconIntegration, IconScene, IconMemory, IconObs,
} from '@/components/profile/tab-icons'

import IdentityPage     from '@/screens/profile/settings/IdentityPage'
import BrainPage        from '@/screens/profile/settings/BrainPage'
import VoicePage        from '@/screens/profile/settings/VoicePage'
import MemoryPage       from '@/screens/profile/settings/MemoryPage'
import SkillsPage       from '@/screens/profile/settings/SkillsPage'
import ModelPage        from '@/screens/profile/settings/ModelPage'
import ScenePage        from '@/screens/profile/settings/ScenePage'
import ChannelsPage from '@/screens/profile/settings/ChannelsPage'
import ObsPage          from '@/screens/profile/settings/ObsPage'

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
