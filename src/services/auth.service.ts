import httpStatus from 'http-status';
import tokenService from './token.service';
import userService from './user.service';
import ApiError from '../utils/ApiError';
import { LoaiToken as TokenType, NGUOIDUNG as User } from '@prisma/client';
import prisma from '../client';
import { encryptPassword, isPasswordMatch } from '../utils/encryption';
import { AuthTokensResponse } from '../types/response';
import exclude from '../utils/exclude';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Omit<User, 'password'>>}
 */
const loginUserWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<Omit<User, 'matKhau'>> => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await isPasswordMatch(password, user.matKhau as string))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email hoặc mật khẩu không chính xác');
  }
  return exclude(user, ['matKhau']);
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenData = await prisma.tOKEN.findFirst({
    where: {
      token: refreshToken,
      loaiToken: TokenType.REFRESH,
      daSuDung: false
    }
  });
  if (!refreshTokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy');
  }
  await prisma.tOKEN.delete({ where: { maToken: refreshTokenData.maToken } });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(refreshToken, TokenType.REFRESH);
    const { maNguoiDung } = refreshTokenData;
    await prisma.tOKEN.delete({ where: { maToken: refreshTokenData.maToken } });
    return tokenService.generateAuthTokens({ maNguoiDung });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Vui lòng xác thực');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );
    const user = await userService.getUserById(resetPasswordTokenData.maNguoiDung);
    if (!user) {
      throw new Error();
    }
    const encryptedPassword = await encryptPassword(newPassword);
    await userService.updateUserById(user.maNguoiDung, { matKhau: encryptedPassword });
    await prisma.tOKEN.deleteMany({
      where: { maNguoiDung: user.maNguoiDung, loaiToken: TokenType.RESET_PASSWORD }
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Đặt lại mật khẩu không thành công');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    );
    await prisma.tOKEN.deleteMany({
      where: { maNguoiDung: verifyEmailTokenData.maNguoiDung, loaiToken: TokenType.VERIFY_EMAIL }
    });
    await userService.updateUserById(verifyEmailTokenData.maNguoiDung, { daXacThucEmail: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Xác thực email không thành công');
  }
};

export default {
  loginUserWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail
};
