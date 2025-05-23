// src/routes/v1/phong.route.ts

import express from 'express';
import phongController from '../../controllers/phong.controller';
import auth from '../../middlewares/auth';
import validateUpdatePhong from '../../middlewares/validateUpdatePhong';

const router = express.Router();

// Tạo phòng mới trong kênh
router.post('/', auth(), phongController.createRoom);

// Lấy thông tin phòng theo ID
router.get('/:maPhong', auth(), phongController.getRoomById);

// Cập nhật phòng (bao gồm trang và lựa chọn)
router.put('/:maPhong', auth(), validateUpdatePhong, phongController.updateRoom);

// Các route mở rộng trong tương lai có thể bao gồm:
// router.delete('/:maPhong', auth(), phongController.deleteRoom);
// router.get('/kenh/:maKenh', auth(), phongController.getRoomsInChannel);

export default router;
