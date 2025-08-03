export default () => ({
  auth: {
    cookieOptions: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
