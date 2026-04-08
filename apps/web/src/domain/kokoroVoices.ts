/**
 * Kokoro voice catalog — used as fallback when the backend voices endpoint is unavailable.
 * Keep in sync with KokoroTtsProvider on the backend.
 */
export const LANG_LABELS: Record<string, string> = {
  a: 'English (US)',
  b: 'English (UK)',
  e: 'Spanish',
  f: 'French',
  h: 'Hindi',
  i: 'Italian',
  j: 'Japanese',
  p: 'Portuguese',
  z: 'Chinese',
}

export const KOKORO_VOICE_IDS: ReadonlyArray<string> = [
  'af_alloy','af_aoede','af_bella','af_heart','af_jadzia','af_jessica',
  'af_kore','af_nicole','af_nova','af_river','af_sarah','af_sky',
  'am_adam','am_echo','am_eric','am_fenrir','am_liam','am_michael',
  'am_onyx','am_puck','am_santa',
  'bf_alice','bf_emma','bf_lily',
  'bm_daniel','bm_fable','bm_george','bm_lewis',
  'ef_dora','em_alex','em_santa',
  'ff_siwis',
  'hf_alpha','hf_beta','hm_omega','hm_psi',
  'if_sara','im_nicola',
  'jf_alpha','jf_gongitsune','jf_nezumi','jf_tebukuro','jm_kumo',
  'pf_dora','pm_alex','pm_santa',
  'zf_xiaobei','zf_xiaoni','zf_xiaoxiao','zf_xiaoyi',
  'zm_yunjian','zm_yunxi','zm_yunxia','zm_yunyang',
  // legacy (v0)
  'af_v0','af_v0bella','af_v0irulan','af_v0nicole','af_v0sarah','af_v0sky',
  'am_v0adam','am_v0gurney','am_v0michael',
  'bf_v0emma','bf_v0isabella',
  'bm_v0george','bm_v0lewis',
]

export interface VoiceOption {
  id: string
  label: string
  lang: string
  legacy: boolean
}

export function parseVoices(): Map<string, VoiceOption[]> {
  const groups = new Map<string, VoiceOption[]>()
  for (const id of KOKORO_VOICE_IDS) {
    const prefix = id.split('_')[0]
    const lang = prefix[0]
    const gender = prefix[1] === 'f' ? 'Female' : 'Male'
    const namePart = id.slice(prefix.length + 1)
    const legacy = namePart.startsWith('v0')
    const rawName = legacy ? namePart.slice(2) : namePart
    const name = rawName.replace(/^\w/, c => c.toUpperCase())
    const label = legacy ? `${name} (${gender}, v0)` : `${name} (${gender})`
    const bucket = groups.get(lang) ?? []
    bucket.push({ id, label, lang, legacy })
    groups.set(lang, bucket)
  }
  return groups
}

export const VOICE_GROUPS = parseVoices()
