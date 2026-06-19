export const BookmarkRouter = {
  Root: 'users/me/bookmarks',
  HttpApiTags: 'Bookmarks',
  Http: {
    List: '',
    Create: '',
    Delete: ':kind/:targetId',
    Import: 'import',
  },
} as const;
