export const CareerRouter = {
  Root: 'career',
  HttpApiTags: 'Career (Beta)',
  Http: {
    Search: '',
    GetSummary: ':playerId',
    GetStats: ':playerId/stats',
  },
} as const;
