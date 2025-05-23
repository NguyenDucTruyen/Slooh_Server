// src\services\kenh.service.ts
import { PrismaClient, TrangThai, TrangThaiThanhVien, VaiTroKenh } from '@prisma/client';
import httpStatus from 'http-status';
import { createErrorResponse, createSuccessResponse } from '../helpers/CreateResponse.helper';
import { ServiceResponse } from '../interfaces/ServiceResponse.interface';

const prisma = new PrismaClient();

// Kiểm tra quyền chủ kênh
const checkIsChannelOwner = async (channelId: string, userId: string): Promise<boolean> => {
  const member = await prisma.tHANHVIENKENH.findUnique({
    where: {
      maNguoiDung_maKenh: {
        maNguoiDung: userId,
        maKenh: channelId
      }
    }
  });

  return member?.vaiTro === VaiTroKenh.CHU_KENH;
};

// Helper function to validate channel name
const validateChannelName = (
  channelName: string,
  existingName?: string
): ServiceResponse | null => {
  if (!channelName || channelName.trim() === '') {
    return createErrorResponse(httpStatus.BAD_REQUEST, 'Tên kênh không được để trống.');
  }

  if (channelName.length < 5) {
    return createErrorResponse(httpStatus.BAD_REQUEST, 'Tên kênh phải có ít nhất 5 ký tự.');
  }

  if (channelName.length > 50) {
    return createErrorResponse(httpStatus.BAD_REQUEST, 'Tên kênh không được vượt quá 50 ký tự.');
  }

  if (existingName && channelName === existingName) {
    return createErrorResponse(
      httpStatus.BAD_REQUEST,
      'Tên kênh không được giống tên kênh hiện tại.'
    );
  }

  return null;
};

// Tạo kênh mới và gán người tạo làm chủ kênh
const createChannel = async (channelName: string, userId: string): Promise<ServiceResponse> => {
  const validationError = validateChannelName(channelName);
  if (validationError) return validationError;

  try {
    const createdChannel = await prisma.kENH.create({
      data: {
        tenKenh: channelName,
        thanhVien: {
          create: {
            maNguoiDung: userId,
            vaiTro: VaiTroKenh.CHU_KENH,
            trangThai: TrangThaiThanhVien.THAM_GIA
          }
        }
      }
    });

    return createSuccessResponse(httpStatus.CREATED, 'Tạo kênh thành công.', createdChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tạo kênh');
  }
};

// Cập nhật tên kênh
const updateChannel = async (
  channelId: string,
  channelName: string,
  userId: string
): Promise<ServiceResponse> => {
  try {
    const isChannelOwner = await checkIsChannelOwner(channelId, userId);
    if (!isChannelOwner) {
      return createErrorResponse(httpStatus.FORBIDDEN, 'Bạn không có quyền cập nhật kênh này.');
    }

    const channel = await prisma.kENH.findUnique({ where: { maKenh: channelId } });

    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh.');
    }

    if (channel.ngayXoa) {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Kênh đã bị xóa.');
    }

    const validationError = validateChannelName(channelName, channel.tenKenh);
    if (validationError) return validationError;

    const updatedChannel = await prisma.kENH.update({
      where: { maKenh: channelId },
      data: { tenKenh: channelName }
    });

    return createSuccessResponse(httpStatus.OK, 'Cập nhật tên kênh thành công.', updatedChannel);
  } catch (error) {
    console.error('Error updating channel:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể cập nhật tên kênh');
  }
};

// Xóa mềm kênh
const deleteChannel = async (channelId: string): Promise<ServiceResponse> => {
  try {
    const channel = await prisma.kENH.findUnique({ where: { maKenh: channelId } });

    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh.');
    }

    if (channel.ngayXoa) {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Kênh đã bị xóa.');
    }

    const result = await prisma.kENH.update({
      where: { maKenh: channelId },
      data: {
        trangThai: TrangThai.KHOA,
        ngayXoa: new Date()
      }
    });

    return createSuccessResponse(httpStatus.OK, 'Xóa kênh thành công.');
  } catch (error) {
    console.error('Error deleting channel:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể xóa kênh');
  }
};

// Lấy thông tin kênh theo ID
const getChannelById = async (channelId: string): Promise<ServiceResponse> => {
  try {
    const channel = await prisma.kENH.findUnique({
      where: { maKenh: channelId },
      include: {
        thanhVien: {
          include: { nguoiDung: true }
        }
      }
    });

    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh.');
    }

    return createSuccessResponse(httpStatus.OK, 'Lấy thông tin kênh thành công.', channel);
  } catch (error) {
    console.error('Error getting channel by ID:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy thông tin kênh');
  }
};

// Lấy danh sách kênh với phân trang
const getChannelList = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const [channels, total] = await Promise.all([
      prisma.kENH.findMany({
        where: {
          ngayXoa: null,
          thanhVien: {
            some: {
              maNguoiDung: userId,
              vaiTro: VaiTroKenh.CHU_KENH
            }
          }
        },
        include: {
          thanhVien: {
            include: { nguoiDung: true }
          }
        },
        skip,
        take: limit
      }),
      prisma.kENH.count({
        where: {
          ngayXoa: null,
          thanhVien: {
            some: {
              maNguoiDung: userId,
              vaiTro: VaiTroKenh.CHU_KENH
            }
          }
        }
      })
    ]);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách kênh thành công.', {
      channels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting channel list:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy danh sách kênh');
  }
};

// Admin lấy danh sách kênh
const getAllChannelList = async (
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const [channels, total] = await Promise.all([
      prisma.kENH.findMany({
        where: { ngayXoa: null },
        include: {
          thanhVien: {
            include: { nguoiDung: true }
          }
        },
        skip,
        take: limit
      }),
      prisma.kENH.count({ where: { ngayXoa: null } })
    ]);

    if (!channels || channels.length === 0) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh nào.');
    }

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách kênh thành công.', {
      channels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting channel list:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy danh sách kênh');
  }
};
// Helper to find users by emails
const findUsersByEmails = async (emails: string[]): Promise<ServiceResponse> => {
  const users = await prisma.nGUOIDUNG.findMany({
    where: { email: { in: emails } }
  });

  if (users.length === 0) {
    return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng nào phù hợp.');
  }

  return createSuccessResponse(httpStatus.OK, '', users);
};

// Helper to check owner permissions
const checkOwnerPermission = async (
  channelId: string,
  userId: string,
  action: string
): Promise<ServiceResponse | null> => {
  const isChannelOwner = await checkIsChannelOwner(channelId, userId);

  if (!isChannelOwner) {
    return createErrorResponse(httpStatus.FORBIDDEN, `Bạn không có quyền ${action} kênh này.`);
  }

  return null;
};

// Tìm kiếm email người dùng trong kênh
const searchChannelUsers = async (
  channelId: string,
  searchText: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.tHANHVIENKENH.findMany({
        where: {
          maKenh: channelId,
          nguoiDung: {
            OR: [
              { email: { contains: searchText, mode: 'insensitive' } },
              { hoTen: { contains: searchText, mode: 'insensitive' } }
            ]
          }
        },
        include: {
          nguoiDung: {
            select: {
              email: true,
              hoTen: true,
              anhDaiDien: true
            }
          }
        },
        skip,
        take: limit
      }),
      prisma.tHANHVIENKENH.count({
        where: {
          maKenh: channelId,
          nguoiDung: {
            OR: [
              { email: { contains: searchText, mode: 'insensitive' } },
              { hoTen: { contains: searchText, mode: 'insensitive' } }
            ]
          }
        }
      })
    ]);

    if (!users || users.length === 0) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy người dùng nào.');
    }

    const formattedUsers = users.map((member) => ({
      email: member.nguoiDung.email,
      hoTen: member.nguoiDung.hoTen,
      anhDaiDien: member.nguoiDung.anhDaiDien,
      trangThai: member.trangThai
    }));

    return createSuccessResponse(httpStatus.OK, 'Tìm kiếm người dùng thành công.', {
      users: formattedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error searching channel users:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tìm kiếm người dùng');
  }
};

// Hủy yêu cầu tham gia kênh
const cancelJoinRequest = async (channelId: string, userId: string): Promise<ServiceResponse> => {
  try {
    const existingRequest = await prisma.tHANHVIENKENH.findUnique({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      }
    });

    if (!existingRequest || existingRequest.trangThai !== TrangThaiThanhVien.YEU_CAU) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy yêu cầu tham gia.');
    }

    await prisma.tHANHVIENKENH.delete({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      }
    });

    return createSuccessResponse(httpStatus.OK, 'Hủy yêu cầu tham gia thành công.');
  } catch (error) {
    console.error('Error canceling join request:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể hủy yêu cầu tham gia');
  }
};

// Lấy danh sách kênh đang tham gia
const getJoinedChannels = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const [channels, total] = await Promise.all([
      prisma.tHANHVIENKENH.findMany({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.THAM_GIA,
          kenh: { ngayXoa: null },
          vaiTro: VaiTroKenh.THANH_VIEN
        },
        include: {
          kenh: true
        },
        skip,
        take: limit
      }),
      prisma.tHANHVIENKENH.count({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.THAM_GIA,
          kenh: { ngayXoa: null },
          vaiTro: VaiTroKenh.THANH_VIEN
        }
      })
    ]);

    const formattedChannels = channels.map((member) => ({
      ...member.kenh,
      vaiTro: member.vaiTro
    }));

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách kênh đang tham gia thành công.', {
      channels: formattedChannels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting joined channels:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể lấy danh sách kênh đang tham gia'
    );
  }
};

// Lấy danh sách kênh đã gửi yêu cầu tham gia
const getPendingJoinRequests = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const [channels, total] = await Promise.all([
      prisma.tHANHVIENKENH.findMany({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.YEU_CAU,
          kenh: { ngayXoa: null }
        },
        include: {
          kenh: true
        },
        skip,
        take: limit
      }),
      prisma.tHANHVIENKENH.count({
        where: {
          maNguoiDung: userId,
          trangThai: TrangThaiThanhVien.YEU_CAU,
          kenh: { ngayXoa: null }
        }
      })
    ]);

    const formattedChannels = channels.map((member) => member.kenh);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách yêu cầu tham gia thành công.', {
      channels: formattedChannels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting pending join requests:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể lấy danh sách yêu cầu tham gia'
    );
  }
};

// Rời kênh
const leaveChannel = async (channelId: string, userId: string): Promise<ServiceResponse> => {
  try {
    const member = await prisma.tHANHVIENKENH.findUnique({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      }
    });

    if (!member) {
      return createErrorResponse(
        httpStatus.NOT_FOUND,
        'Bạn không phải là thành viên của kênh này.'
      );
    }

    if (member.vaiTro === VaiTroKenh.CHU_KENH) {
      return createErrorResponse(httpStatus.FORBIDDEN, 'Chủ kênh không thể rời kênh.');
    }

    await prisma.tHANHVIENKENH.delete({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      }
    });

    return createSuccessResponse(httpStatus.OK, 'Rời kênh thành công.');
  } catch (error) {
    console.error('Error leaving channel:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể rời kênh');
  }
};

// Thêm người dùng vào kênh
const addUsersToChannel = async (
  channelId: string,
  emails: string[],
  executorId: string
): Promise<ServiceResponse> => {
  try {
    const permissionError = await checkOwnerPermission(
      channelId,
      executorId,
      'thêm người dùng vào'
    );
    if (permissionError) return permissionError;

    const usersResponse = await findUsersByEmails(emails);
    if (!usersResponse.success) return usersResponse;
    const users = usersResponse.data;

    const data = users.map((u: { maNguoiDung: any }) => ({
      maKenh: channelId,
      maNguoiDung: u.maNguoiDung,
      vaiTro: VaiTroKenh.THANH_VIEN,
      trangThai: TrangThaiThanhVien.THAM_GIA
    }));

    const result = await prisma.tHANHVIENKENH.createMany({
      data,
      skipDuplicates: true
    });

    if (result.count > 0) {
      return createSuccessResponse(httpStatus.OK, 'Thêm người dùng vào kênh thành công.', result);
    }

    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể thêm người dùng vào kênh.'
    );
  } catch (error) {
    console.error('Error adding users to channel:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể thêm người dùng vào kênh'
    );
  }
};

// Xóa người dùng khỏi kênh
const removeUsersFromChannel = async (
  channelId: string,
  emails: string[],
  userId: string
): Promise<ServiceResponse> => {
  try {
    const permissionError = await checkOwnerPermission(channelId, userId, 'xóa người dùng khỏi');
    if (permissionError) return permissionError;

    const usersResponse = await findUsersByEmails(emails);
    if (!usersResponse.success) return usersResponse;
    const users = usersResponse.data;

    const result = await Promise.all(
      users.map((user: { maNguoiDung: any }) =>
        prisma.tHANHVIENKENH.deleteMany({
          where: {
            maKenh: channelId,
            maNguoiDung: user.maNguoiDung
          }
        })
      )
    );

    if (result.length > 0) {
      return createSuccessResponse(httpStatus.OK, 'Xóa người dùng khỏi kênh thành công.', result);
    }

    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể xóa người dùng khỏi kênh.'
    );
  } catch (error) {
    console.error('Error removing users from channel:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể xóa người dùng khỏi kênh'
    );
  }
};

// Người dùng yêu cầu tham gia kênh
const requestToJoinChannel = async (
  channelId: string,
  userId: string
): Promise<ServiceResponse> => {
  try {
    const existingMember = await prisma.tHANHVIENKENH.findUnique({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      }
    });

    if (existingMember) {
      if (existingMember.trangThai === TrangThaiThanhVien.YEU_CAU) {
        return createErrorResponse(
          httpStatus.CONFLICT,
          'Bạn đã gửi yêu cầu tham gia kênh này trước đó.'
        );
      }

      if (existingMember.trangThai === TrangThaiThanhVien.THAM_GIA) {
        return createErrorResponse(httpStatus.CONFLICT, 'Bạn đã là thành viên của kênh này.');
      }
    }

    const result = await prisma.tHANHVIENKENH.upsert({
      where: {
        maNguoiDung_maKenh: { maNguoiDung: userId, maKenh: channelId }
      },
      update: {
        trangThai: TrangThaiThanhVien.YEU_CAU
      },
      create: {
        maKenh: channelId,
        maNguoiDung: userId,
        vaiTro: VaiTroKenh.THANH_VIEN,
        trangThai: TrangThaiThanhVien.YEU_CAU
      }
    });

    return createSuccessResponse(httpStatus.OK, 'Gửi yêu cầu tham gia kênh thành công.', result);
  } catch (error) {
    console.error('Error requesting to join channel:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể gửi yêu cầu tham gia kênh'
    );
  }
};

// Helper for processing join requests
const processJoinRequests = async (
  channelId: string,
  emails: string[],
  userId: string,
  action: 'accept' | 'reject'
): Promise<ServiceResponse> => {
  try {
    const permissionError = await checkOwnerPermission(
      channelId,
      userId,
      action === 'accept' ? 'chấp nhận yêu cầu tham gia' : 'từ chối yêu cầu tham gia'
    );
    if (permissionError) return permissionError;

    const usersResponse = await findUsersByEmails(emails);
    if (!usersResponse.success) return usersResponse;
    const users = usersResponse.data;

    const result = await Promise.all(
      users.map((user: { maNguoiDung: any }) => {
        if (action === 'accept') {
          return prisma.tHANHVIENKENH.update({
            where: {
              maNguoiDung_maKenh: { maNguoiDung: user.maNguoiDung, maKenh: channelId }
            },
            data: { trangThai: TrangThaiThanhVien.THAM_GIA }
          });
        } else {
          return prisma.tHANHVIENKENH.delete({
            where: {
              maNguoiDung_maKenh: { maNguoiDung: user.maNguoiDung, maKenh: channelId }
            }
          });
        }
      })
    );

    if (result.length > 0) {
      const message =
        action === 'accept'
          ? 'Chấp nhận yêu cầu tham gia thành công.'
          : 'Từ chối yêu cầu tham gia thành công.';

      return createSuccessResponse(httpStatus.OK, message, result);
    }

    const errorMessage =
      action === 'accept'
        ? 'Không thể chấp nhận yêu cầu tham gia kênh.'
        : 'Không thể từ chối yêu cầu tham gia kênh.';

    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, errorMessage);
  } catch (error) {
    console.error(`Error ${action === 'accept' ? 'accepting' : 'rejecting'} join requests:`, error);
    const errorMessage =
      action === 'accept'
        ? 'Không thể chấp nhận yêu cầu tham gia'
        : 'Không thể từ chối yêu cầu tham gia';

    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, errorMessage);
  }
};

// Admin chấp nhận yêu cầu tham gia
const acceptJoinRequests = async (
  channelId: string,
  emails: string[],
  userId: string
): Promise<ServiceResponse> => {
  return processJoinRequests(channelId, emails, userId, 'accept');
};

// Admin từ chối yêu cầu tham gia
const rejectJoinRequests = async (
  channelId: string,
  emails: string[],
  userId: string
): Promise<ServiceResponse> => {
  return processJoinRequests(channelId, emails, userId, 'reject');
};

export default {
  checkIsChannelOwner,
  createChannel,
  updateChannel,
  deleteChannel,
  getChannelById,
  getChannelList,
  getAllChannelList,
  requestToJoinChannel,
  addUsersToChannel,
  removeUsersFromChannel,
  acceptJoinRequests,
  rejectJoinRequests,
  searchChannelUsers,
  cancelJoinRequest,
  getJoinedChannels,
  getPendingJoinRequests,
  leaveChannel
};
