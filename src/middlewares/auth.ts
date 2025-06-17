import { NGUOIDUNG as User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import config from '../config/config';
import { roleRights } from '../config/roles';
import ApiError from '../utils/ApiError';
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

    // Check if user account is locked
    if (user.trangThai === 'KHOA') {
      return reject(
        new ApiError(
          httpStatus.FORBIDDEN,
          'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        )
      );
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
