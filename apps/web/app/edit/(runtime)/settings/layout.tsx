import { type ReactNode } from 'react'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-hidden">{children}</div>
}
