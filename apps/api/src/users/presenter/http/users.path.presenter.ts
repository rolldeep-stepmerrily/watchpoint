export const UsersRouter = {
  Root: 'users',
  HttpApiTags: 'Users',
  Http: {
    GetMe: 'me',
    UpdateProfile: 'me',
    ChangePassword: 'me/password',
  },
} as const;
