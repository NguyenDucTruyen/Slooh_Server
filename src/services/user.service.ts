import { Prisma, Quyen as Role, TrangThai as Status, NGUOIDUNG as User } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import { encryptPassword } from '../utils/encryption';

/**
 * Create a user
 * @param {string} email
 * @param {string} password
 * @param {string} [hoTen]
 * @param {Role} [quyen]
 * @returns {Promise<User>}
 */
const createUser = async (
  email: string,
  password: string,
  hoTen: string,
  quyen: Role = Role.NGUOI_DUNG
): Promise<User> => {
  if (await getUserByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email đã tồn tại');
  }
  return prisma.nGUOIDUNG.create({
    data: {
      email,
      hoTen,
      matKhau: await encryptPassword(password),
      quyen,
      trangThai: Status.HOAT_DONG
    }
  });
};

/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @returns {Promise<{users: Omit<User, 'matKhau'>[], total: number}>}
 */
const queryUsers = async (
  filter: any, // Change to any to handle custom filter logic
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<{ users: Omit<User, 'matKhau'>[]; total: number }> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'ngayTao';
  const sortType = options.sortType ?? 'desc';

  // Build Prisma where clause
  const whereClause: Prisma.NGUOIDUNGWhereInput = {};

  // Handle hoTen filtering with partial matching
  if (filter.hoTen && filter.hoTen !== '') {
    whereClause.hoTen = {
      contains: filter.hoTen,
      mode: 'insensitive' // Case-insensitive search
    };
  }

  // Handle quyen filtering
  if (filter.quyen && filter.quyen !== '') {
    whereClause.quyen = filter.quyen;
  }

  // Execute both queries in parallel for better performance
  const [users, total] = await Promise.all([
    prisma.nGUOIDUNG.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType }
    }),
    prisma.nGUOIDUNG.count({ where: whereClause }) // Fixed: Apply same filter to count
  ]);

  return {
    users: users.map(({ matKhau, ...user }) => user),
    total
  };
};

/**
 * Get user by ID
 * @param {string} maNguoiDung
 * @returns {Promise<User | null>}
 */
const getUserById = async (maNguoiDung: string): Promise<User | null> => {
  return prisma.nGUOIDUNG.findUnique({ where: { maNguoiDung } });
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User | null>}
 */
const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.nGUOIDUNG.findUnique({ where: { email } });
};

/**
 * Update user by ID
 * @param {string} maNguoiDung
 * @param {Prisma.NGUOIDUNGUpdateInput} updateBody
 * @returns {Promise<User | null>}
 */
const updateUserById = async (
  maNguoiDung: string,
  updateBody: Prisma.NGUOIDUNGUpdateInput
): Promise<User | null> => {
  const user = await getUserById(maNguoiDung);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
  }
  if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email đã tồn tại');
  }

  // If password is being updated, encrypt it
  if (updateBody.matKhau) {
    updateBody.matKhau = await encryptPassword(updateBody.matKhau as string);
  }

  return prisma.nGUOIDUNG.update({ where: { maNguoiDung }, data: updateBody });
};

/**
 * Change user password
 * @param {string} maNguoiDung
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const changePassword = async (
  maNguoiDung: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await getUserById(maNguoiDung);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
  }

  // Verify current password
  const { isPasswordMatch } = await import('../utils/encryption');
  if (!(await isPasswordMatch(currentPassword, user.matKhau))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Mật khẩu hiện tại không chính xác');
  }

  // Update with new password
  const hashedNewPassword = await encryptPassword(newPassword);
  await prisma.nGUOIDUNG.update({
    where: { maNguoiDung },
    data: { matKhau: hashedNewPassword }
  });
};

/**
 * Update user status (Admin only)
 * @param {string} maNguoiDung
 * @param {Status} trangThai
 * @returns {Promise<User>}
 */
const updateUserStatus = async (maNguoiDung: string, trangThai: Status): Promise<User> => {
  const user = await getUserById(maNguoiDung);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
  }

  return prisma.nGUOIDUNG.update({
    where: { maNguoiDung },
    data: { trangThai }
  });
};

/**
 * Delete user by ID
 * @param {string} maNguoiDung
 * @returns {Promise<User>}
 */
const deleteUserById = async (maNguoiDung: string): Promise<User> => {
  const user = await getUserById(maNguoiDung);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng');
  }
  await prisma.nGUOIDUNG.delete({ where: { maNguoiDung } });
  return user;
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  changePassword,
  updateUserStatus
};
