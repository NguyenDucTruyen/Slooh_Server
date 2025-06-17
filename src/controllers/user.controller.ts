import { NGUOIDUNG as User } from '@prisma/client';
import httpStatus from 'http-status';
import { userService } from '../services';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import exclude from '../utils/exclude';
import pick from '../utils/pick';

const createUser = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  const user = await userService.createUser(email, password, name, role);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
  }
  res.send(exclude(user, ['matKhau']));
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user ? exclude(user, ['matKhau']) : null);
});

// Change password for authenticated user
const changePassword = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { currentPassword, newPassword } = req.body;

  await userService.changePassword(user.maNguoiDung, currentPassword, newPassword);
  res.send({ message: 'Đổi mật khẩu thành công' });
});

// Update user status (Admin only)
const updateUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { trangThai } = req.body;

  const updatedUser = await userService.updateUserStatus(userId, trangThai);
  res.send(exclude(updatedUser, ['matKhau']));
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getMe = catchAsync(async (req, res) => {
  const user = req.user as User;
  const userExisted = await userService.getUserById(user.maNguoiDung);
  if (!userExisted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
  }
  res.send(exclude(userExisted, ['matKhau']));
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  changePassword,
  updateUserStatus
};
