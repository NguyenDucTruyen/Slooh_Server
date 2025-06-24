import { NGUOIDUNG as User } from '@prisma/client';
import httpStatus from 'http-status';
import config from '../config';
import { authService, emailService, tokenService, userService } from '../services';
import catchAsync from '../utils/catchAsync';
import exclude from '../utils/exclude';
const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const user = await userService.createUser(email, password, name);
  const userWithoutPassword = exclude(user, ['matKhau', 'ngayCapNhat', 'ngayTao']);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user: userWithoutPassword, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ tokens });
});
const loginWithGoogle = catchAsync(async (req, res) => {
  const user = req.user as User;
  const tokens = await tokenService.generateAuthTokens(user);
  res.redirect(
    `${config.appUrl.client}/auth/callback?accessToken=${tokens.access.token}&refreshToken=${tokens.refresh?.token}`
  );
});
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.send({
    message: 'Đã gửi email đặt lại mật khẩu, vui lòng kiểm tra email của bạn'
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.send({
    message: 'Đặt lại mật khẩu thành công'
  });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user as User;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.send({
    message: 'Đã gửi email thành công'
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.send({
    message: 'Xác thực email thành công'
  });
});

export default {
  register,
  login,
  loginWithGoogle,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
};
