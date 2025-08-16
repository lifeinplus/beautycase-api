import * as request from 'supertest';

export class CookieHelper {
  static extractCookie(
    response: request.Response,
    name: string,
  ): string | undefined {
    const setCookieHeader = response.headers['set-cookie'];

    if (!setCookieHeader) return;

    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader];

    return cookies.find(
      (cookie: string) =>
        cookie.startsWith(`${name}=`) &&
        !cookie.startsWith(`${name}=;`) &&
        cookie.includes('.'),
    );
  }

  static extractJwtCookie(response: request.Response): string | undefined {
    return this.extractCookie(response, 'jwt');
  }

  static parseCookieValue(cookieString: string): string {
    return cookieString.split(';')[0].split('=')[1];
  }
}
