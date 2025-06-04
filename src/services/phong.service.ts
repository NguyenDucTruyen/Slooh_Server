// src/services/phong.service.ts
import httpStatus from 'http-status';
import { createErrorResponse, createSuccessResponse } from '../helpers/CreateResponse.helper';
import { Phong } from '../interfaces/Phong.interface';
import { ServiceResponse } from '../interfaces/ServiceResponse.interface';
import kenhRepository from '../repositories/kenh.repository';
import phongRepository from '../repositories/phong.repository';
import kenhService from './kenh.service';

const createRoom = async (
  roomName: string,
  channelId: string,
  userId: string
): Promise<ServiceResponse> => {
  try {
    const isOwner = await kenhService.checkIsChannelOwner(channelId, userId);
    if (!isOwner) {
      return createErrorResponse(httpStatus.FORBIDDEN, 'You are not the owner of this channel.');
    }

    if (!roomName || roomName.trim() === '') {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Room name is required.');
    }

    const existingRoom = await phongRepository.findRoomByNameAndChannel(roomName, channelId);
    if (existingRoom) {
      return createErrorResponse(httpStatus.CONFLICT, 'Room already exists in this channel.');
    }

    const newRoom = await phongRepository.createRoom(roomName, channelId);

    return createSuccessResponse(httpStatus.CREATED, 'Room created successfully.', newRoom);
  } catch (error) {
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create room.');
  }
};

const createPublicRoom = async (
  roomName: string,
  description: string | undefined,
  userId: string
): Promise<ServiceResponse> => {
  try {
    if (!roomName || roomName.trim() === '') {
      return createErrorResponse(httpStatus.BAD_REQUEST, 'Room name is required.');
    }

    // Check if public room with same name exists
    const existingRoom = await phongRepository.findRoomByNameAndChannel(roomName, null);
    if (existingRoom) {
      return createErrorResponse(httpStatus.CONFLICT, 'Public room with this name already exists.');
    }

    const newRoom = await phongRepository.createPublicRoom(userId, roomName, description);

    return createSuccessResponse(httpStatus.CREATED, 'Public room created successfully.', newRoom);
  } catch (error) {
    console.error('Create public room error:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create public room.');
  }
};

const getRoomDetails = async (roomId: string): Promise<ServiceResponse> => {
  try {
    console.log('Fetching room details for ID:', roomId);
    const room = await phongRepository.getRoomById(roomId);
    console.log('Room details:', room);
    if (!room) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Room not found.');
    }
    return createSuccessResponse(httpStatus.OK, 'Room details retrieved.', room);
  } catch (error) {
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve room.');
  }
};

const getRoomsByChannel = async (
  channelId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    // Check if channel exists
    const channel = await kenhRepository.findChannelById(channelId);
    if (!channel) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Channel not found.');
    }

    // Check if user is a member of the channel
    const member = await kenhRepository.findMemberByUserAndChannel(userId, channelId);
    if (!member || member.trangThai !== 'THAM_GIA') {
      return createErrorResponse(httpStatus.FORBIDDEN, 'You are not a member of this channel.');
    }

    const { rooms, total } = await phongRepository.getRoomsByChannelId(channelId, page, limit);

    return createSuccessResponse(httpStatus.OK, 'Rooms retrieved successfully.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get rooms by channel error:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve rooms.');
  }
};

const getRoomsOwnedByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    // Get all channels where user is owner
    const ownedChannels = await kenhRepository.findChannelsOwnedByUser(userId);
    const channelIds = ownedChannels.map((channel) => channel.maKenh);

    if (channelIds.length === 0) {
      return createSuccessResponse(httpStatus.OK, 'No rooms found.', {
        rooms: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      });
    }

    const { rooms, total } = await phongRepository.getRoomsOwnedByUser(channelIds, page, limit);

    return createSuccessResponse(httpStatus.OK, 'Rooms retrieved successfully.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get rooms owned by user error:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve rooms.');
  }
};

const getPublicRooms = async (
  maNguoiDung: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  try {
    const { rooms, total } = await phongRepository.getPublicRooms(maNguoiDung, page, limit);

    return createSuccessResponse(httpStatus.OK, 'Public rooms retrieved successfully.', {
      rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get public rooms error:', error);
    return createErrorResponse(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to retrieve public rooms.'
    );
  }
};

const updateRoom = async (
  roomId: string,
  roomData: Phong,
  userId: string
): Promise<ServiceResponse> => {
  try {
    // Check if room exists
    const existingRoom = await phongRepository.getRoomById(roomId);
    if (!existingRoom) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Room not found.');
    }

    // Check ownership
    const { isOwner, isPublic } = await phongRepository.checkRoomOwnership(roomId, userId);

    if (!isPublic && !isOwner) {
      return createErrorResponse(
        httpStatus.FORBIDDEN,
        'You do not have permission to update this room.'
      );
    }

    // For public rooms, might want to add additional checks (e.g., admin role)
    // if (isPublic && user.quyen !== 'ADMIN') {
    //   return createErrorResponse(httpStatus.FORBIDDEN, 'Only admins can update public rooms.');
    // }

    // Validate room data
    const validationError = validateRoomData(roomData);
    if (validationError) {
      return createErrorResponse(httpStatus.BAD_REQUEST, validationError);
    }

    // Update room
    const updatedRoom = await phongRepository.updateRoom(roomId, roomData);

    // Transform response to match interface
    const transformedRoom = transformRoomResponse(updatedRoom);

    return createSuccessResponse(httpStatus.OK, 'Room updated successfully.', transformedRoom);
  } catch (error) {
    console.error('Update room error:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update room.');
  }
};

const deleteRoom = async (roomId: string, userId: string): Promise<ServiceResponse> => {
  try {
    // Check if room exists
    const existingRoom = await phongRepository.getRoomById(roomId);
    if (!existingRoom) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Room not found.');
    }

    // Check if user has permission to delete
    if (existingRoom.maKenh) {
      const isOwner = await kenhService.checkIsChannelOwner(existingRoom.maKenh, userId);
      if (!isOwner) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'You are not authorized to delete this room.'
        );
      }
    } else {
      // For public rooms, check if user is the creator
      if (existingRoom.maNguoiTao !== userId) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'You are not authorized to delete this room.'
        );
      }
    }

    await phongRepository.deleteRoom(roomId);
    return createSuccessResponse(httpStatus.OK, 'Room deleted successfully.');
  } catch (error) {
    console.error('Delete room error:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete room.');
  }
};

const cloneRoom = async (
  sourceRoomId: string,
  userId: string,
  targetChannelId?: string
): Promise<ServiceResponse> => {
  try {
    // Check if source room exists
    const sourceRoom = await phongRepository.getRoomById(sourceRoomId);
    if (!sourceRoom) {
      return createErrorResponse(httpStatus.NOT_FOUND, 'Source room not found.');
    }

    // If target channel is specified, check if user has permission
    if (targetChannelId) {
      const isChannelOwner = await kenhService.checkIsChannelOwner(targetChannelId, userId);
      if (!isChannelOwner) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'You must be the owner of the target channel.'
        );
      }
    }

    // If source room is in a channel, check if user has permission to view it
    if (sourceRoom.maKenh) {
      const isChannelMember = await kenhService.checkIsChannelOwner(sourceRoom.maKenh, userId);
      if (!isChannelMember) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'You do not have permission to clone this room.'
        );
      }
    }

    const clonedRoom = await phongRepository.cloneRoom(
      sourceRoomId,
      userId,
      targetChannelId || null
    );
    return createSuccessResponse(httpStatus.CREATED, 'Room cloned successfully.', {
      ...clonedRoom,
      isPublic: !targetChannelId
    });
  } catch (error) {
    console.error('Clone room error:', error);
    return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to clone room.');
  }
};

const validateRoomData = (roomData: Phong): string | null => {
  // Validate room name
  if (!roomData.tenPhong || roomData.tenPhong.trim() === '') {
    return 'Room name is required.';
  }

  // Validate pages if provided
  if (roomData.danhSachTrang && roomData.danhSachTrang.length > 0) {
    for (let i = 0; i < roomData.danhSachTrang.length; i++) {
      const trang = roomData.danhSachTrang[i];

      // Validate page type
      if (!trang.loaiTrang || !['NOI_DUNG', 'CAU_HOI'].includes(trang.loaiTrang)) {
        return `Page ${i + 1}: Invalid page type.`;
      }

      // Validate title
      if (!trang.tieuDe || trang.tieuDe.trim() === '') {
        return `Page ${i + 1}: Title is required.`;
      }

      // Validate choices for question pages
      if (trang.loaiTrang === 'CAU_HOI') {
        if (!trang.danhSachLuaChon || trang.danhSachLuaChon.length === 0) {
          return `Page ${i + 1}: Question pages must have at least one choice.`;
        }

        // Check if at least one choice is correct
        const hasCorrectAnswer = trang.danhSachLuaChon.some((choice) => choice.ketQua === true);
        if (!hasCorrectAnswer) {
          return `Page ${i + 1}: At least one choice must be marked as correct.`;
        }

        // Validate each choice
        for (let j = 0; j < trang.danhSachLuaChon.length; j++) {
          const choice = trang.danhSachLuaChon[j];
          if (!choice.noiDung || choice.noiDung.trim() === '') {
            return `Page ${i + 1}, Choice ${j + 1}: Content is required.`;
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

export default {
  createRoom,
  createPublicRoom,
  getRoomDetails,
  getRoomsByChannel,
  getRoomsOwnedByUser,
  getPublicRooms,
  updateRoom,
  deleteRoom,
  cloneRoom
};
