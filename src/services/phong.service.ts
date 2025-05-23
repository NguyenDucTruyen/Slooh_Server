import httpStatus from 'http-status';
import { createErrorResponse, createSuccessResponse } from '../helpers/CreateResponse.helper';
import { Phong } from '../interfaces/Phong.interface';
import { ServiceResponse } from '../interfaces/ServiceResponse.interface';
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

    // Check if user is owner of the channel
    const isOwner = await kenhService.checkIsChannelOwner(existingRoom.maKenh!, userId);
    if (!isOwner) {
      return createErrorResponse(httpStatus.FORBIDDEN, 'You are not the owner of this channel.');
    }

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
  getRoomDetails,
  updateRoom
};
