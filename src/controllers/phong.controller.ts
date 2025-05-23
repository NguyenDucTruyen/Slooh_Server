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

// Get room details by ID
const getRoomById = catchAsync(async (req, res) => {
  const { maPhong } = req.params;

  const result = await phongService.getRoomDetails(maPhong);
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

export default {
  createRoom,
  getRoomById,
  updateRoom
};
