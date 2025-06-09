// src/services/kenh.service.ts
import { TrangThaiThanhVien, VaiTroKenh } from '@prisma/client';
import httpStatus from 'http-status';
import { createErrorResponse, createSuccessResponse } from '../helpers/CreateResponse.helper';
import { ServiceResponse } from '../interfaces/ServiceResponse.interface';
import kenhRepository from '../repositories/kenh.repository';

// Kiểm tra quyền chủ kênh
const checkIsChannelOwner = async (channelId: string, userId: string): Promise<boolean> => {
  const member = await kenhRepository.findMemberByUserAndChannel(userId, channelId);
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
    const createdChannel = await kenhRepository.createChannel(channelName, userId);
    return createSuccessResponse(httpStatus.CREATED, 'Tạo kênh thành công.', createdChannel);
  } catch (error) {
    console.error('Lỗi khi tạo kênh:', error);
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

    const channel = await kenhRepository.findChannelById(channelId);

    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh.');
    }

    if (channel.ngayXoa) {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Kênh đã bị xóa.');
    }

    const validationError = validateChannelName(channelName, channel.tenKenh);
    if (validationError) return validationError;

    const updatedChannel = await kenhRepository.updateChannel(channelId, channelName);
    return createSuccessResponse(httpStatus.OK, 'Cập nhật tên kênh thành công.', updatedChannel);
  } catch (error) {
    console.error('Lỗi khi cập nhật tên kênh:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể cập nhật tên kênh');
  }
};

// Xóa mềm kênh
const deleteChannel = async (channelId: string): Promise<ServiceResponse> => {
  try {
    const channel = await kenhRepository.findChannelById(channelId);

    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh.');
    }

    if (channel.ngayXoa) {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Kênh đã bị xóa.');
    }

    await kenhRepository.softDeleteChannel(channelId);
    return createSuccessResponse(httpStatus.OK, 'Xóa kênh thành công.');
  } catch (error) {
    console.error('Lỗi khi xóa kênh:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể xóa kênh');
  }
};

// Lấy thông tin kênh theo ID
const getChannelById = async (channelId: string): Promise<ServiceResponse> => {
  try {
    const channel = await kenhRepository.findChannelById(channelId);

    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh.');
    }

    return createSuccessResponse(httpStatus.OK, 'Lấy thông tin kênh thành công.', channel);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin kênh:', error);
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
    const { channels, total } = await kenhRepository.findChannelsByOwner(userId, skip, limit);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách kênh thành công.', {
      channels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách kênh:', error);
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
    const { channels, total } = await kenhRepository.findAllChannels(skip, limit);

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
    console.error('Lỗi khi lấy danh sách kênh:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy danh sách kênh');
  }
};

// Helper to find users by emails
const findUsersByEmails = async (emails: string[]): Promise<ServiceResponse> => {
  const users = await kenhRepository.findUsersByEmails(emails);

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
    const { users, total } = await kenhRepository.searchChannelMembers(
      channelId,
      searchText,
      skip,
      limit
    );

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
    console.error('Lỗi khi tìm kiếm người dùng:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tìm kiếm người dùng');
  }
};

// Hủy yêu cầu tham gia kênh
const cancelJoinRequest = async (channelId: string, userId: string): Promise<ServiceResponse> => {
  try {
    const existingRequest = await kenhRepository.findMemberByUserAndChannel(userId, channelId);

    if (!existingRequest || existingRequest.trangThai !== TrangThaiThanhVien.YEU_CAU) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy yêu cầu tham gia.');
    }

    await kenhRepository.deleteMember(userId, channelId);
    return createSuccessResponse(httpStatus.OK, 'Hủy yêu cầu tham gia thành công.');
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu tham gia:', error);
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
    const { channels, total } = await kenhRepository.findJoinedChannels(userId, skip, limit);

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
    console.error('Lỗi khi lấy danh sách kênh đang tham gia:', error);
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
    const { channels, total } = await kenhRepository.findPendingRequests(userId, skip, limit);

    const formattedChannels = channels.map((member) => member.kenh);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách yêu cầu tham gia thành công.', {
      channels: formattedChannels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách yêu cầu tham gia:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể lấy danh sách yêu cầu tham gia'
    );
  }
};

// Rời kênh
const leaveChannel = async (channelId: string, userId: string): Promise<ServiceResponse> => {
  try {
    const member = await kenhRepository.findMemberByUserAndChannel(userId, channelId);

    if (!member) {
      return createErrorResponse(
        httpStatus.NOT_FOUND,
        'Bạn không phải là thành viên của kênh này.'
      );
    }

    if (member.vaiTro === VaiTroKenh.CHU_KENH) {
      return createErrorResponse(httpStatus.FORBIDDEN, 'Chủ kênh không thể rời kênh.');
    }

    await kenhRepository.deleteMember(userId, channelId);
    return createSuccessResponse(httpStatus.OK, 'Rời kênh thành công.');
  } catch (error) {
    console.error('Lỗi khi rời kênh:', error);
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

    const result = await kenhRepository.createManyMembers(data);

    if (result.count > 0) {
      return createSuccessResponse(httpStatus.OK, 'Thêm người dùng vào kênh thành công.', result);
    }

    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể thêm người dùng vào kênh.'
    );
  } catch (error) {
    console.error('Lỗi khi thêm người dùng vào kênh:', error);
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

    const userIds = users.map((user: { maNguoiDung: any }) => user.maNguoiDung);
    const result = await kenhRepository.deleteManyMembersByUserIds(channelId, userIds);

    if (result.length > 0) {
      return createSuccessResponse(httpStatus.OK, 'Xóa người dùng khỏi kênh thành công.', result);
    }

    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể xóa người dùng khỏi kênh.'
    );
  } catch (error) {
    console.error('Lỗi khi xóa người dùng khỏi kênh:', error);
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
    const existingMember = await kenhRepository.findMemberByUserAndChannel(userId, channelId);

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

    const result = await kenhRepository.createOrUpdateMember(
      userId,
      channelId,
      VaiTroKenh.THANH_VIEN,
      TrangThaiThanhVien.YEU_CAU
    );

    return createSuccessResponse(httpStatus.OK, 'Gửi yêu cầu tham gia kênh thành công.', result);
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu tham gia kênh:', error);
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

    const userIds = users.map((user: { maNguoiDung: any }) => user.maNguoiDung);

    let result;
    if (action === 'accept') {
      result = await kenhRepository.updateManyMembersStatus(
        channelId,
        userIds,
        TrangThaiThanhVien.THAM_GIA
      );
    } else {
      result = await kenhRepository.deleteManyMembersByUserIds(channelId, userIds);
    }

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
    console.error(`Lỗi khi ${action === 'accept' ? 'accepting' : 'rejecting'} yêu cầu tham gia:`, error);
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
