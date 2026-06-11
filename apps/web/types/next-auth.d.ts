import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    error?: string
    user: {
      userId:      string
      name:        string
      email:       string
      image:       string | null
      roles:       string[]
      accessToken: string
      expiresAt:   number
      nickname:    string | null
      locale?:     string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?:   string
    refreshToken?:  string
    expiresAt?:     number
    roles?:         string[]
    nickname?:      string | null
    locale?:        string
    error?:         string
    backendUserId?: string
  }
}
