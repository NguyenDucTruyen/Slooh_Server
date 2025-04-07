import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { NextFunction, Request, Response } from 'express';
import { NGUOIDUNG as User } from '@prisma/client';
import config from '../config/config';
const verifyCallback =
  (
    req: any,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void,
    requiredRights: string[]
  ) =>
  async (err: unknown, user: User | false, info: unknown) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Vui lòng xác thực'));
    }
    req.user = user;

    if (requiredRights.length) {
      const userRights = roleRights.get(user.quyen) ?? [];
      const hasRequiredRights = requiredRights.every((requiredRight) =>
        userRights.includes(requiredRight)
      );
      if (!hasRequiredRights && req.params.userId !== user.maNguoiDung) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const auth =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  return new Promise<void>((resolve) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err) {
        const { message } = err;
        res.redirect(`${config.appUrl.client}/auth/login?error=${message}`);
      }
      req.user = user;
      resolve();
    })(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

export default auth;
export { googleAuth };
