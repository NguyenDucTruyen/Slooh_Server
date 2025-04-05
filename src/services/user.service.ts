import { NGUOIDUNG as User, Quyen as Role, TrangThai as Status, Prisma } from '@prisma/client';
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
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
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
 * @returns {Promise<User[]>}
 */
const queryUsers = async (
  filter: Prisma.NGUOIDUNGWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<User[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'ngayTao';
  const sortType = options.sortType ?? 'desc';

  return prisma.nGUOIDUNG.findMany({
    where: filter,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortType }
  });
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
  return prisma.nGUOIDUNG.update({ where: { maNguoiDung }, data: updateBody });
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
  deleteUserById
};
