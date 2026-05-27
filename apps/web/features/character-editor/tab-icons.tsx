import {
  Atom,
  Chat,
  Cloud,
  Computer,
  Connector,
  Image,
  Lightning,
  Lock,
  Logout,
  Memory,
  Microphone,
  Search,
  Settings,
  Styles,
  Tool,
  Trash,
  User,
} from '@/shared/ui/icons'
import { Smile, SlidersHorizontal } from 'lucide-react'

const DEFAULT_SIZE = 18

export const IconUser = () => <User size={DEFAULT_SIZE} />
export const IconSkills = () => <Lightning size={DEFAULT_SIZE} />
export const IconScene = () => <Image size={DEFAULT_SIZE} />
export const IconMemory = () => <Memory size={DEFAULT_SIZE} />
export const IconWorkshop = () => <Tool size={DEFAULT_SIZE} />
export const IconSearch = () => <Search size={DEFAULT_SIZE} />
export const IconBackup = () => <Cloud size={DEFAULT_SIZE} />
export const IconMessage = () => <Chat size={DEFAULT_SIZE} />
export const IconBrain = () => <Atom size={DEFAULT_SIZE} />
export const IconMicrophone = () => <Microphone size={DEFAULT_SIZE} />
export const IconPaint = () => <Styles size={DEFAULT_SIZE} />
export const IconObs = () => <Computer size={DEFAULT_SIZE} />
export const IconSettings = () => <Settings size={DEFAULT_SIZE} />
export const IconTrash = () => <Trash size={DEFAULT_SIZE} />
export const IconLogout = () => <Logout size={DEFAULT_SIZE} />
export const IconKey = () => <Lock size={DEFAULT_SIZE} />
export const IconIntegration = () => <Connector size={DEFAULT_SIZE} />
export const IconEmotion  = () => <Smile             size={DEFAULT_SIZE} />
export const IconBehavior = () => <SlidersHorizontal size={DEFAULT_SIZE} />
