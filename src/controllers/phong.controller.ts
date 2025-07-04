// src/controllers/phong.controller.ts
import { NGUOIDUNG as User } from '@prisma/client';
import phongService from '../services/phong.service';
import sendResponse from '../utils/ApiResponse.util';
import catchAsync from '../utils/catchAsync';

// Create a new room in a channel
const createRoom = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { tenPhong, maKenh } = req.body;

  const result = await phongService.createRoom(tenPhong, maKenh, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Create a public room (no channel required)
const createPublicRoom = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { tenPhong, moTa } = req.body;

  const result = await phongService.createPublicRoom(tenPhong, moTa, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get room details by ID
const getRoomById = catchAsync(async (req, res) => {
  const { maPhong } = req.params;

  const result = await phongService.getRoomDetails(maPhong);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get all rooms in a channel
const getRoomsByChannel = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await phongService.getRoomsByChannel(maKenh, user.maNguoiDung, page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get all rooms owned by user (through their channels)
const getRoomsOwnedByUser = catchAsync(async (req, res) => {
  const user = req.user as User;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await phongService.getRoomsOwnedByUser(user.maNguoiDung, page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get all public rooms
const getPublicRooms = catchAsync(async (req, res) => {
  const user = req.user as User;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await phongService.getPublicRooms(user.maNguoiDung, page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Update room with full data including pages and choices
const updateRoom = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maPhong } = req.params;
  const roomData = req.body;

  const result = await phongService.updateRoom(maPhong, roomData, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Delete a room
const deleteRoom = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maPhong } = req.params;

  const result = await phongService.deleteRoom(maPhong, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Clone a room
const cloneRoom = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maPhong } = req.params;
  const { targetChannelId } = req.body; // If not provided, will create a public room

  const result = await phongService.cloneRoom(maPhong, user.maNguoiDung, targetChannelId);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// ADMIN APIs - Get all rooms
const getAllRooms = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await phongService.getAllRooms(page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// ADMIN APIs - Get all rooms in channel
const getAllRoomsInChannel = catchAsync(async (req, res) => {
  const { maKenh } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await phongService.getAllRoomsInChannel(maKenh, page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// ADMIN APIs - Get all public rooms
const getAllPublicRooms = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await phongService.getAllPublicRooms(page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// ADMIN APIs - Update room status
const updateRoomStatus = catchAsync(async (req, res) => {
  const { maPhong } = req.params;
  const { trangThai } = req.body;

  const result = await phongService.updateRoomStatus(maPhong, trangThai);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

const extractRoomFromFile = catchAsync(async (req, res) => {
  const user = req.user as User;
  const file = req.file;
  const { maKenh, tenPhong, userPrompt } = req.body;

  if (!file) {
    return sendResponse(res, 400, false, 'Vui lòng tải lên một file.', null);
  }

  const result = await phongService.extractRoomDataFromFile(
    file,
    tenPhong,
    maKenh,
    userPrompt,
    user.maNguoiDung
  );
  
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

export default {
  createRoom,
  createPublicRoom,
  getRoomById,
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
  extractRoomFromFile // Add new function to export
};
