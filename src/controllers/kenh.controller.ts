import { NGUOIDUNG as User } from '@prisma/client';
import kenhService from '../services/kenh.service';
import sendResponse from '../utils/ApiResponse.util';
import catchAsync from '../utils/catchAsync';

// Create a new channel
const createChannel = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { tenKenh } = req.body;

  const result = await kenhService.createChannel(tenKenh, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Update channel name
const updateChannel = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;
  const { tenKenh } = req.body;

  const result = await kenhService.updateChannel(maKenh, tenKenh, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Soft delete channel
const deleteChannel = catchAsync(async (req, res) => {
  const { maKenh } = req.params;

  const result = await kenhService.deleteChannel(maKenh);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// List all channels with pagination
const getChannelList = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await kenhService.getChannelList(page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Request to join a channel
const requestToJoin = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;

  const result = await kenhService.requestToJoinChannel(maKenh, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Add members to channel (by email)
const addUsersToChannel = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;
  const { listEmail } = req.body;

  const result = await kenhService.addUsersToChannel(maKenh, listEmail, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Remove members from channel (by email)
const removeUsersFromChannel = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;
  const { listEmail } = req.body;

  const result = await kenhService.removeUsersFromChannel(maKenh, listEmail, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Accept join requests
const acceptJoinRequests = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;
  const { listEmail } = req.body;

  const result = await kenhService.acceptJoinRequests(maKenh, listEmail, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Reject join requests
const rejectJoinRequests = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;
  const { listEmail } = req.body;

  const result = await kenhService.rejectJoinRequests(maKenh, listEmail, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Search users in a channel
const searchChannelUsers = catchAsync(async (req, res) => {
  const { maKenh } = req.params;
  const { searchText } = req.body;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await kenhService.searchChannelUsers(maKenh, searchText, page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Cancel join request
const cancelJoinRequest = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;

  const result = await kenhService.cancelJoinRequest(maKenh, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get joined channels
const getJoinedChannels = catchAsync(async (req, res) => {
  const user = req.user as User;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await kenhService.getJoinedChannels(user.maNguoiDung, page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Get pending join requests
const getPendingJoinRequests = catchAsync(async (req, res) => {
  const user = req.user as User;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await kenhService.getPendingJoinRequests(user.maNguoiDung, page, limit);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

// Leave a channel
const leaveChannel = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { maKenh } = req.params;

  const result = await kenhService.leaveChannel(maKenh, user.maNguoiDung);
  sendResponse(res, result.statusCode, result.success, result.message, result.data);
});

export default {
  createChannel,
  updateChannel,
  deleteChannel,
  getChannelList,
  requestToJoin,
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
