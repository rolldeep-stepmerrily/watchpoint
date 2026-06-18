export const AuthRouter = {
  Root: 'auth',
  HttpApiTags: 'Auth',
  Http: {
    SignUp: 'sign-up',
    Login: 'login',
    GithubLogin: 'github',
    GithubCallback: 'github/callback',
    Refresh: 'refresh',
    Logout: 'logout',
  },
} as const;
