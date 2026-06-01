import type { UserProjectTemplate } from '@/shared/data/project-templates'
import type { CreateTemplateData, ITemplateStore } from './ITemplateStore'

const STORAGE_KEY = 'inktide_user_templates'

function load(): UserProjectTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(templates: UserProjectTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

function newId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export class LocalTemplateStore implements ITemplateStore {
  async list(): Promise<UserProjectTemplate[]> {
    return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async get(id: string): Promise<UserProjectTemplate | null> {
    return load().find(t => t.id === id) ?? null
  }

  async create(data: CreateTemplateData): Promise<UserProjectTemplate> {
    const templates = load()
    const now = new Date().toISOString()
    const template: UserProjectTemplate = {
      ...data,
      id: newId(),
      tagline: 'Custom',
      longDescription: data.longDescription ?? data.description,
      features: [],
      nextSteps: [],
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    }
    save([...templates, template])
    return template
  }

  async update(id: string, data: Partial<CreateTemplateData>): Promise<UserProjectTemplate> {
    const templates = load()
    const idx = templates.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Template ${id} not found`)
    const updated: UserProjectTemplate = {
      ...templates[idx]!,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    templates[idx] = updated
    save(templates)
    return updated
  }

  async delete(id: string): Promise<void> {
    save(load().filter(t => t.id !== id))
  }
}
