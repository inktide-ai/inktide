export interface ParsedCombo {
  key: string
  meta: boolean
  ctrl: boolean
  shift: boolean
  alt: boolean
}

export interface ShortcutOptions {
  /** Don't fire when focus is in input/textarea/[contenteditable]. Default: false */
  allowInInput?: boolean
  /** Call e.preventDefault() when shortcut fires. Default: true */
  preventDefault?: boolean
  /** Conditionally enable/disable without unmounting. Default: true */
  enabled?: boolean
  /** Higher priority wins when multiple handlers match. Default: 0. Use 10 for modals. */
  priority?: number
}

export interface ShortcutEntry {
  canonical: string
  handler: () => void
  opts: Required<ShortcutOptions>
}
