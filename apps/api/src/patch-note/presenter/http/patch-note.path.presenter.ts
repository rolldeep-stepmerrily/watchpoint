export const PatchNoteRouter = {
  Root: 'patch-notes',
  HttpApiTags: 'PatchNote',
  Http: {
    GetList: '',
    GetLatest: 'latest',
    GetOne: ':version',
    GetEntries: ':version/entries',
  },
} as const;
