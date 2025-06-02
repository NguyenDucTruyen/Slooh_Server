// src/routes/v1/phong.route.ts

import express from 'express';
import phongController from '../../controllers/phong.controller';
import auth from '../../middlewares/auth';
import validateUpdatePhong from '../../middlewares/validateUpdatePhong';

const router = express.Router();

// Get all public rooms (no auth required for public rooms)
router.get('/public', auth(), phongController.getPublicRooms);

// Get all rooms owned by the user (requires auth)
router.get('/owned', auth(), phongController.getRoomsOwnedByUser);

// Get all rooms in a specific channel
router.get('/kenh/:maKenh', auth(), phongController.getRoomsByChannel);

// Create a new room in a channel
router.post('/', auth(), phongController.createRoom);

// Create a public room (no channel required)
router.post('/public', auth(), phongController.createPublicRoom);

// Get room details by ID
router.get('/:maPhong', auth(), phongController.getRoomById);

// Update room (including pages and choices)
router.put('/:maPhong', auth(), validateUpdatePhong, phongController.updateRoom);

// Future routes can include:
// router.delete('/:maPhong', auth(), phongController.deleteRoom);
// router.post('/:maPhong/clone', auth(), phongController.cloneRoom);
// router.patch('/:maPhong/status', auth(), phongController.updateRoomStatus);

export default router;
