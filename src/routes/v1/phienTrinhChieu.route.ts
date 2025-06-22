// src/routes/v1/phienTrinhChieu.route.ts
import express from 'express';
import phienTrinhChieuController from '../../controllers/phienTrinhChieu.controller';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import phienTrinhChieuValidation from '../../validations/phienTrinhChieu.validation';

const router = express.Router();

// Create new presentation session (requires auth)
router.post(
  '/',
  auth(),
  validate(phienTrinhChieuValidation.createPhien),
  phienTrinhChieuController.createPhien
);

// Get session by PIN (no auth required for public preview)
router.get(
  '/pin/:maPin',
  validate(phienTrinhChieuValidation.getPhienByPin),
  phienTrinhChieuController.getPhienByPin
);

// Get session details (optional auth)
router.get(
  '/:maPhien',
  validate(phienTrinhChieuValidation.getPhienById),
  phienTrinhChieuController.getPhienById
);

// Get leaderboard (no auth required)
router.get(
  '/:maPhien/leaderboard',
  validate(phienTrinhChieuValidation.getPhienById),
  phienTrinhChieuController.getLeaderboard
);

// End session (requires auth)
router.delete(
  '/:maPhien',
  auth(),
  validate(phienTrinhChieuValidation.getPhienById),
  phienTrinhChieuController.endPhien
);

// Get PIN by room ID (auth required)
router.get(
  '/pin/room/:maPhong',
  auth(),
  validate(phienTrinhChieuValidation.getPinByRoomId),
  phienTrinhChieuController.getPinByRoomId
);

export default router;
