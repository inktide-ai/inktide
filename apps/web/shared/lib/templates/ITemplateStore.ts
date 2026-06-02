import type { TemplateCategory, TemplatePlatform, UserProjectTemplate } from '@/shared/data/project-templates'

export type CreateTemplateData = {
  name: string
  emoji: string
  description: string
  longDescription?: string
  accentColor: string
  defaultName: string
  systemPrompt: string
  category: TemplateCategory
  platforms: TemplatePlatform[]
}

export interface ITemplateStore {
  list(): Promise<UserProjectTemplate[]>
  get(id: string): Promise<UserProjectTemplate | null>
  create(data: CreateTemplateData): Promise<UserProjectTemplate>
  update(id: string, data: Partial<CreateTemplateData>): Promise<UserProjectTemplate>
  delete(id: string): Promise<void>
}
