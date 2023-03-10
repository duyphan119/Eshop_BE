import * as jwt from "jsonwebtoken";
class AuthService {
  signAccessToken(obj: any, expiresIn?: number) {
    return jwt.sign(obj, process.env.AT_SECRET as string, {
      expiresIn: expiresIn || 6000,
    });
  }
  signRefreshToken(obj: any, expiresIn?: number) {
    return jwt.sign(obj, process.env.RT_SECRET as string, {
      expiresIn: expiresIn || 1000 * 60 * 60 * 24 * 365,
    });
  }
  verifyRefreshToken(refreshToken: string) {
    return jwt.verify(refreshToken, process.env.RT_SECRET as string);
  }
}

const authService = new AuthService();

export default authService;
