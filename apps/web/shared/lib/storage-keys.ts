export const STORAGE_KEYS = {
  wizard: {
    selections:  'v1_inktide_wizard_selections',
    channels:    'v1_inktide_wizard_channels',
    personality: 'v1_inktide_wizard_personality',
    template:    'v1_inktide_wizard_template',
  },
  graph: (characterId: string) => `inktide_graph_${characterId}`,
  oauth: {
    pending: (connectorId: string, soulId: string) =>
      `v1_inktide_oauth_pending:${connectorId}:${soulId}`,
  },
} as const
