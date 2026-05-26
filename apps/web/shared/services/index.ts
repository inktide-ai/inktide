import { KeycloakTokenParser } from './auth/KeycloakTokenParser'
import { KeycloakLocaleSync } from './auth/KeycloakLocaleSync'
import { MeAvatarService } from './auth/MeAvatarService'

export const tokenParser = new KeycloakTokenParser()
export const localeSync = new KeycloakLocaleSync()
export const avatarService = new MeAvatarService()
