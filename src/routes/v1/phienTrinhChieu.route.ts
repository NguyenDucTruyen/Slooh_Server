// src/routes/v1/phienTrinhChieu.route.ts
import express from 'express';
import phienTrinhChieuController from '../../controllers/phienTrinhChieu.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Create new presentation session (requires auth)
router.post('/', auth(), phienTrinhChieuController.createPhien);

// Get session by PIN (no auth required for public preview)
router.get('/pin/:maPin', phienTrinhChieuController.getPhienByPin);

// Get session details (optional auth)
router.get('/:maPhien', phienTrinhChieuController.getPhienById);

// Get leaderboard (no auth required)
router.get('/:maPhien/leaderboard', phienTrinhChieuController.getLeaderboard);

// End session (requires auth)
router.delete('/:maPhien', auth(), phienTrinhChieuController.endPhien);

export default router;
