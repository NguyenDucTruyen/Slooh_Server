// src\routes\v1\kenh.route.ts
import express from 'express';
import kenhController from '../../controllers/kenh.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router
  .route('/')
  .get(auth(), kenhController.getChannelList) // Lấy danh sách kênh
  .post(auth(), kenhController.createChannel); // Tạo kênh mới

router
  .route('/:maKenh')
  .patch(auth(), kenhController.updateChannel) // Cập nhật tên kênh
  .delete(auth(), kenhController.deleteChannel); // Xóa kênh

router.post('/:maKenh/yeuCau', auth(), kenhController.requestToJoin); // Yêu cầu tham gia kênh
router.post('/:maKenh/thanhVien', auth(), kenhController.addUsersToChannel); // Thêm người vào kênh
router.delete('/:maKenh/thanhVien', auth(), kenhController.removeUsersFromChannel); // Xóa người khỏi kênh
router.post('/:maKenh/yeuCau/dongY', auth(), kenhController.acceptJoinRequests); // Chấp nhận yêu cầu
router.post('/:maKenh/yeuCau/tuChoi', auth(), kenhController.rejectJoinRequests); // Từ chối yêu cầu
router.post('/:maKenh/timKiem', auth(), kenhController.searchChannelUsers); // Tìm kiếm người dùng trong kênh
router.delete('/:maKenh/yeuCau', auth(), kenhController.cancelJoinRequest); // Hủy yêu cầu tham gia
router.post('/:maKenh/roi', auth(), kenhController.leaveChannel); // Rời kênh

router.get('/daThamGia', auth(), kenhController.getJoinedChannels); // Lấy danh sách kênh đã tham gia
router.get('/yeuCauThamGia', auth(), kenhController.getPendingJoinRequests); // Lấy danh sách kênh đã gửi yêu cầu
router.get('/:maKenh', auth(), kenhController.getChannelById);

export default router;
