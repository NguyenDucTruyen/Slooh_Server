// src/controllers/phienTrinhChieu.controller.ts
import { NGUOIDUNG as User } from '@prisma/client';
import phienTrinhChieuService from '../services/phienTrinhChieu.service';
import sendResponse from '../utils/ApiResponse.util';
import catchAsync from '../utils/catchAsync';

// Create new presentation session
const createPhien = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maPhong } = req.body;

  const result = await phienTrinhChieuService.createPhien(maPhong, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get session details by ID
const getPhienById = catchAsync(async (req, res) => {
  const user = req.user as User | undefined;
  const { maPhien } = req.params;

  const result = await phienTrinhChieuService.getPhienDetails(maPhien, user?.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get session details by PIN (for joining)
const getPhienByPin = catchAsync(async (req, res) => {
  const { maPin } = req.params;

  const result = await phienTrinhChieuService.getPhienByPin(maPin);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get leaderboard
const getLeaderboard = catchAsync(async (req, res) => {
  const { maPhien } = req.params;

  const result = await phienTrinhChieuService.getLeaderboard(maPhien);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// End session
const endPhien = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maPhien } = req.params;

  const result = await phienTrinhChieuService.endPhien(maPhien, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get PIN by room ID
const getPinByRoomId = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maPhong } = req.params;

  const result = await phienTrinhChieuService.getPinByRoomId(maPhong, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

export default {
  createPhien,
  getPhienById,
  getPhienByPin,
  getLeaderboard,
  endPhien,
  getPinByRoomId
};
