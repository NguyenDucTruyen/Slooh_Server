import { MA as Token, LoaiMa as TokenType } from '@prisma/client';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import prisma from '../client';
import config from '../config';
import { AuthTokensResponse } from '../types/response';
import ApiError from '../utils/ApiError';
import userService from './user.service';

/**
 * Generate ma
 * @param {string} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (
  userId: string,
  expires: Moment,
  type: TokenType,
  secret = config.jwt.secret
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a ma
 * @param {string} ma
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (
  ma: string,
  maNguoiDung: string,
  hetHan: Moment,
  type: TokenType,
  daSuDung = false
): Promise<Token> => {
  const createdToken = prisma.mA.create({
    data: {
      ma,
      maNguoiDung,
      hetHan: hetHan.toDate(),
      loaiMa: type,
      daSuDung
    }
  });
  return createdToken;
};

/**
 * Verify ma and return ma doc (or throw an error if it is not valid)
 * @param {string} ma
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (ma: string, type: TokenType): Promise<Token> => {
  const payload = jwt.verify(ma, config.jwt.secret);
  const userId = String(payload.sub);
  const tokenData = await prisma.mA.findFirst({
    where: { ma, loaiMa: type, maNguoiDung: userId, daSuDung: false }
  });
  if (!tokenData) {
    throw new Error('Token không hợp lệ hoặc đã bị thu hồi');
  }
  return tokenData;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (user: { maNguoiDung: string }): Promise<AuthTokensResponse> => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.maNguoiDung, accessTokenExpires, TokenType.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.maNguoiDung, refreshTokenExpires, TokenType.REFRESH);
  await saveToken(refreshToken, user.maNguoiDung, refreshTokenExpires, TokenType.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate()
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate()
    }
  };
};

/**
 * Generate reset password ma
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng với email này');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.maNguoiDung, expires, TokenType.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.maNguoiDung, expires, TokenType.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email ma
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user: { maNguoiDung: string }): Promise<string> => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.maNguoiDung, expires, TokenType.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.maNguoiDung, expires, TokenType.VERIFY_EMAIL);
  return verifyEmailToken;
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken
};
