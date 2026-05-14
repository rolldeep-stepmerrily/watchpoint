export const HeroRouter = {
  Root: 'heroes',
  HttpApiTags: 'Hero',
  Http: {
    GetList: '',
    GetOne: ':codename',
    GetAbilities: ':codename/abilities',
    GetPatchHistory: ':codename/patch-history',
  },
} as const;
