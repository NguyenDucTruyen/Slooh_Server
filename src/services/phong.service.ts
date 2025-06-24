// src/services/phong.service.ts
import { TrangThai } from '@prisma/client';
import httpStatus from 'http-status';
import { createErrorResponse, createSuccessResponse } from '../helpers/CreateResponse.helper';
import { Phong } from '../interfaces/Phong.interface';
import { ServiceResponse } from '../interfaces/ServiceResponse.interface';
import kenhRepository from '../repositories/kenh.repository';
import phongRepository from '../repositories/phong.repository';
import { extractContentFromFile } from '../utils/fileExtractor.util';
import { generateRoomDataFromContent } from '../utils/geminiExtractor.util';
import kenhService from './kenh.service';

const createRoom = async (
  roomName: string,
  channelId: string,
  userId: string
): Promise<ServiceResponse> => {
  try {
    const isOwner = await kenhService.checkIsChannelOwner(channelId, userId);
    if (!isOwner) {
      return createErrorResponse(
        httpStatus.FORBIDDEN,
        'Bạn không phải là chủ sở hữu của kênh này.'
      );
    }

    if (!roomName || roomName.trim() === '') {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Tên phòng là bắt buộc.');
    }

    const existingRoom = await phongRepository.findRoomByNameAndChannel(roomName, channelId);
    if (existingRoom) {
      return createErrorResponse(httpStatus.CONFLICT, 'Phòng đã tồn tại trong kênh này.');
    }

    const newRoom = await phongRepository.createRoom(roomName, channelId);

    return createSuccessResponse(httpStatus.CREATED, 'Tạo phòng thành công.', newRoom);
  } catch (error) {
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tạo phòng.');
  }
};

const createPublicRoom = async (
  roomName: string,
  description: string | undefined,
  userId: string
): Promise<ServiceResponse> => {
  try {
    if (!roomName || roomName.trim() === '') {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Tên phòng là bắt buộc.');
    }

    // Kiểm tra xem phòng công cộng với cùng tên đã tồn tại chưa
    const existingRoom = await phongRepository.findRoomByNameAndChannel(roomName, null);
    if (existingRoom) {
      return createErrorResponse(httpStatus.CONFLICT, 'Phòng công cộng với tên này đã tồn tại.');
    }

    const newRoom = await phongRepository.createPublicRoom(userId, roomName, description);

    return createSuccessResponse(httpStatus.CREATED, 'Tạo phòng công cộng thành công.', newRoom);
  } catch (error) {
    console.error('Lỗi tạo phòng công cộng:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tạo phòng công cộng.');
  }
};

const getRoomDetails = async (roomId: string): Promise<ServiceResponse> => {
  try {
    console.log('Đang lấy chi tiết phòng với ID:', roomId);
    const room = await phongRepository.getRoomById(roomId);
    console.log('Chi tiết phòng:', room);
    if (!room) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
    }
    return createSuccessResponse(httpStatus.OK, 'Lấy chi tiết phòng thành công.', room);
  } catch (error) {
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy thông tin phòng.');
  }
};

const getRoomsByChannel = async (
  channelId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    // Kiểm tra xem kênh có tồn tại không
    const channel = await kenhRepository.findChannelById(channelId);
    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy kênh.');
    }

    // Kiểm tra xem người dùng có phải là thành viên của kênh không
    const member = await kenhRepository.findMemberByUserAndChannel(userId, channelId);
    if (!member || member.trangThai !== 'THAM_GIA') {
      return createErrorResponse(
        httpStatus.FORBIDDEN,
        'Bạn không phải là thành viên của kênh này.'
      );
    }

    const { rooms, total } = await phongRepository.getRoomsByChannelId(channelId, page, limit);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách phòng thành công.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi lấy phòng theo kênh:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy danh sách phòng.');
  }
};

const getRoomsOwnedByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    // Lấy tất cả các kênh mà người dùng là chủ sở hữu
    const ownedChannels = await kenhRepository.findChannelsOwnedByUser(userId);
    const channelIds = ownedChannels.map((channel) => channel.maKenh);

    if (channelIds.length === 0) {
      return createSuccessResponse(httpStatus.OK, 'Không tìm thấy phòng nào.', {
        rooms: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      });
    }

    const { rooms, total } = await phongRepository.getRoomsOwnedByUser(channelIds, page, limit);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách phòng thành công.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi lấy phòng của người dùng:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy danh sách phòng.');
  }
};

const getPublicRooms = async (
  maNguoiDung: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const { rooms, total } = await phongRepository.getPublicRooms(maNguoiDung, page, limit);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách phòng công cộng thành công.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi lấy phòng công cộng:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể lấy danh sách phòng công cộng.'
    );
  }
};

const updateRoom = async (
  roomId: string,
  roomData: Phong,
  userId: string
): Promise<ServiceResponse> => {
  try {
    // Kiểm tra xem phòng có tồn tại không
    const existingRoom = await phongRepository.getRoomById(roomId);
    if (!existingRoom) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
    }

    // Kiểm tra quyền sở hữu
    const { isOwner, isPublic } = await phongRepository.checkRoomOwnership(roomId, userId);

    if (!isPublic && !isOwner) {
      return createErrorResponse(httpStatus.FORBIDDEN, 'Bạn không có quyền cập nhật phòng này.');
    }

    // Đối với phòng công cộng, có thể muốn thêm kiểm tra bổ sung (ví dụ: vai trò admin)
    // if (isPublic && user.quyen !== 'ADMIN') {
    //   return createErrorResponse(httpStatus.FORBIDDEN, 'Chỉ admin mới có thể cập nhật phòng công cộng.');
    // }

    // Xác thực dữ liệu phòng
    const validationError = validateRoomData(roomData);
    if (validationError) {
      return createErrorResponse(httpStatus.BAD_REQUEST, validationError);
    }

    // Cập nhật phòng
    const updatedRoom = await phongRepository.updateRoom(roomId, roomData);

    // Chuyển đổi phản hồi để khớp với interface
    const transformedRoom = transformRoomResponse(updatedRoom);

    return createSuccessResponse(httpStatus.OK, 'Cập nhật phòng thành công.', transformedRoom);
  } catch (error) {
    console.error('Lỗi cập nhật phòng:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể cập nhật phòng.');
  }
};

const deleteRoom = async (roomId: string, userId: string): Promise<ServiceResponse> => {
  try {
    // Kiểm tra xem phòng có tồn tại không
    const existingRoom = await phongRepository.getRoomById(roomId);
    if (!existingRoom) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
    }

    // Kiểm tra xem người dùng có quyền xóa không
    if (existingRoom.maKenh) {
      const isOwner = await kenhService.checkIsChannelOwner(existingRoom.maKenh, userId);
      if (!isOwner) {
        return createErrorResponse(httpStatus.FORBIDDEN, 'Bạn không có quyền xóa phòng này.');
      }
    } else {
      // Đối với phòng công cộng, kiểm tra xem người dùng có phải là người tạo không
      if (existingRoom.maNguoiTao !== userId) {
        return createErrorResponse(httpStatus.FORBIDDEN, 'Bạn không có quyền xóa phòng này.');
      }
    }

    await phongRepository.deleteRoom(roomId);
    return createSuccessResponse(httpStatus.OK, 'Xóa phòng thành công.');
  } catch (error) {
    console.error('Lỗi xóa phòng:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể xóa phòng.');
  }
};

const cloneRoom = async (
  sourceRoomId: string,
  userId: string,
  targetChannelId?: string
): Promise<ServiceResponse> => {
  try {
    // Kiểm tra xem phòng nguồn có tồn tại không
    const sourceRoom = await phongRepository.getRoomById(sourceRoomId);
    if (!sourceRoom) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng nguồn.');
    }

    // Nếu kênh đích được chỉ định, kiểm tra xem người dùng có quyền không
    if (targetChannelId) {
      const isChannelOwner = await kenhService.checkIsChannelOwner(targetChannelId, userId);
      if (!isChannelOwner) {
        return createErrorResponse(httpStatus.FORBIDDEN, 'Bạn phải là chủ sở hữu của kênh đích.');
      }
    }

    // Nếu phòng nguồn trong một kênh, kiểm tra xem người dùng có quyền xem không
    if (sourceRoom.maKenh) {
      const isChannelMember = await kenhService.checkIsChannelOwner(sourceRoom.maKenh, userId);
      if (!isChannelMember) {
        return createErrorResponse(httpStatus.FORBIDDEN, 'Bạn không có quyền sao chép phòng này.');
      }
    }

    const clonedRoom = await phongRepository.cloneRoom(
      sourceRoomId,
      userId,
      targetChannelId || null
    );
    return createSuccessResponse(httpStatus.CREATED, 'Sao chép phòng thành công.', {
      ...clonedRoom,
      isPublic: !targetChannelId
    });
  } catch (error) {
    console.error('Lỗi sao chép phòng:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể sao chép phòng.');
  }
};

const validateRoomData = (roomData: Phong): string | null => {
  // Xác thực tên phòng
  if (!roomData.tenPhong || roomData.tenPhong.trim() === '') {
    return 'Tên phòng là bắt buộc.';
  }

  // Xác thực các trang nếu có
  if (roomData.danhSachTrang && roomData.danhSachTrang.length > 0) {
    for (let i = 0; i < roomData.danhSachTrang.length; i++) {
      const trang = roomData.danhSachTrang[i];

      // Xác thực loại trang
      if (!trang.loaiTrang || !['NOI_DUNG', 'CAU_HOI'].includes(trang.loaiTrang)) {
        return `Trang ${i + 1}: Loại trang không hợp lệ.`;
      }

      // Xác thực tiêu đề
      if (!trang.tieuDe || trang.tieuDe.trim() === '') {
        return `Trang ${i + 1}: Tiêu đề là bắt buộc.`;
      }

      // Xác thực lựa chọn cho trang câu hỏi
      if (trang.loaiTrang === 'CAU_HOI') {
        if (!trang.danhSachLuaChon || trang.danhSachLuaChon.length === 0) {
          return `Trang ${i + 1}: Trang câu hỏi phải có ít nhất một lựa chọn.`;
        }

        // Kiểm tra xem có ít nhất một lựa chọn đúng không
        const hasCorrectAnswer = trang.danhSachLuaChon.some((choice) => choice.ketQua === true);
        if (!hasCorrectAnswer) {
          return `Trang ${i + 1}: Phải có ít nhất một lựa chọn được đánh dấu là đúng.`;
        }

        // Xác thực từng lựa chọn
        for (let j = 0; j < trang.danhSachLuaChon.length; j++) {
          const choice = trang.danhSachLuaChon[j];
          if (!choice.noiDung || choice.noiDung.trim() === '') {
            return `Trang ${i + 1}, Lựa chọn ${j + 1}: Nội dung là bắt buộc.`;
          }
        }
      }
    }
  }

  return null;
};

const transformRoomResponse = (room: any): Phong => {
  return {
    maPhong: room.maPhong,
    tenPhong: room.tenPhong,
    moTa: room.moTa,
    maKenh: room.maKenh,
    trangThai: room.trangThai,
    hoatDong: room.hoatDong,
    ngayTao: room.ngayTao,
    danhSachTrang: room.trangs?.map((trang: any) => ({
      maTrang: trang.maTrang,
      loaiTrang: trang.loaiTrang,
      tieuDe: trang.tieuDe,
      hinhAnh: trang.hinhAnh,
      video: trang.video,
      hinhNen: trang.hinhNen,
      cachTrinhBay: trang.cachTrinhBay,
      canLeTieuDe: trang.canLeTieuDe,
      canLeNoiDung: trang.canLeNoiDung,
      noiDung: trang.noiDung,
      thoiGianGioiHan: trang.thoiGianGioiHan,
      diem: trang.diem,
      loaiCauTraLoi: trang.loaiCauTraLoi,
      danhSachLuaChon: trang.luaChon?.map((luaChon: any) => ({
        maLuaChon: luaChon.maLuaChon,
        noiDung: luaChon.noiDung,
        ketQua: luaChon.ketQua
      }))
    }))
  };
};

// ADMIN: Get all rooms
const getAllRooms = async (page: number = 1, limit: number = 10): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const { rooms, total } = await phongRepository.findAllRooms(skip, limit);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách phòng thành công.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy danh sách phòng');
  }
};

// ADMIN: Get all rooms in a specific channel
const getAllRoomsInChannel = async (
  channelId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const { rooms, total } = await phongRepository.findAllRoomsByChannel(channelId, skip, limit);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách phòng trong kênh thành công.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng trong kênh:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể lấy danh sách phòng trong kênh'
    );
  }
};

// ADMIN: Get all public rooms
const getAllPublicRooms = async (
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const skip = (page - 1) * limit;
    const { rooms, total } = await phongRepository.findAllPublicRooms(skip, limit);

    return createSuccessResponse(httpStatus.OK, 'Lấy danh sách phòng công khai thành công.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng công khai:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể lấy danh sách phòng công khai'
    );
  }
};

// ADMIN: Update room status
const updateRoomStatus = async (roomId: string, trangThai: TrangThai): Promise<ServiceResponse> => {
  try {
    const room = await phongRepository.findRoomById(roomId);
    if (!room) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
    }

    const updatedRoom = await phongRepository.updateRoomStatus(roomId, trangThai);
    return createSuccessResponse(
      httpStatus.OK,
      'Cập nhật trạng thái phòng thành công.',
      updatedRoom
    );
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái phòng:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể cập nhật trạng thái phòng'
    );
  }
};

const extractRoomDataFromFile = async (
  file: Express.Multer.File,
  roomName: string,
  channelId: string | null,
  userPrompt: string,
  userId: string
): Promise<ServiceResponse> => {
  try {
    // Validate room name
    if (!roomName || roomName.trim() === '') {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Tên phòng là bắt buộc.');
    }

    // Check permissions if creating in a channel
    if (channelId) {
      const isOwner = await kenhService.checkIsChannelOwner(channelId, userId);
      if (!isOwner) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'Bạn không phải là chủ sở hữu của kênh này.'
        );
      }

      // Check if room already exists in channel
      const existingRoom = await phongRepository.findRoomByNameAndChannel(roomName, channelId);
      if (existingRoom) {
        return createErrorResponse(httpStatus.CONFLICT, 'Phòng đã tồn tại trong kênh này.');
      }
    } else {
      // Check if public room already exists
      const existingRoom = await phongRepository.findRoomByNameAndChannel(roomName, null);
      if (existingRoom) {
        return createErrorResponse(httpStatus.CONFLICT, 'Phòng công cộng với tên này đã tồn tại.');
      }
    }

    // Extract content from file
    const fileContent = await extractContentFromFile(file);

    if (!fileContent) {
      return createErrorResponse(
        httpStatus.BAD_REQUEST,
        'Không thể đọc nội dung file. Vui lòng kiểm tra lại file.'
      );
    }

    // Generate room data from content using Gemini
    const roomData = await generateRoomDataFromContent(fileContent, roomName, userPrompt);

    if (!roomData) {
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể tạo nội dung phòng từ file.'
      );
    }

    // Create room with generated data
    let newRoom;
    if (channelId) {
      newRoom = await phongRepository.createRoomWithPages(roomData, channelId);
    } else {
      newRoom = await phongRepository.createPublicRoomWithPages(roomData, userId);
    }

    // Transform response
    const transformedRoom = transformRoomResponse(newRoom);

    return createSuccessResponse(
      httpStatus.CREATED,
      'Tạo phòng từ file thành công.',
      transformedRoom
    );
  } catch (error) {
    console.error('Lỗi khi tạo phòng từ file:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tạo phòng từ file.');
  }
};

export default {
  createRoom,
  createPublicRoom,
  getRoomDetails,
  getRoomsByChannel,
  getRoomsOwnedByUser,
  getPublicRooms,
  updateRoom,
  deleteRoom,
  cloneRoom,
  getAllRooms,
  getAllRoomsInChannel,
  getAllPublicRooms,
  updateRoomStatus,
  extractRoomDataFromFile // Add new function to export
};
