// src/routes/v1/phong.route.ts
import express from 'express';
import multer from 'multer';
import phongController from '../../controllers/phong.controller';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import validateUpdatePhong from '../../middlewares/validateUpdatePhong';
import { phongValidation } from '../../validations';

const router = express.Router();

// Cấu hình multer cho upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and TXT files are allowed.'));
    }
  }
});

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

// Extract room from file - NEW ROUTE
router.post(
  '/extract-from-file',
  auth(),
  upload.single('file'),
  phongController.extractRoomFromFile
);

// Get room details by ID
router.get('/:maPhong', auth(), phongController.getRoomById);

// Update room (including pages and choices)
router.put('/:maPhong', auth(), validateUpdatePhong, phongController.updateRoom);

// Delete and clone routes
router.delete('/:maPhong', auth(), phongController.deleteRoom);
router.post('/:maPhong/clone', auth(), phongController.cloneRoom);

// Admin routes
router.get(
  '/admin/all',
  auth('manageRooms'),
  validate(phongValidation.getAllRooms),
  phongController.getAllRooms
);
router.get(
  '/admin/kenh/:maKenh',
  auth('manageRooms'),
  validate(phongValidation.getAllRoomsInChannel),
  phongController.getAllRoomsInChannel
);
router.get(
  '/admin/public/all',
  auth('manageRooms'),
  validate(phongValidation.getAllPublicRooms),
  phongController.getAllPublicRooms
);
router.patch(
  '/admin/:maPhong/status',
  auth('manageRooms'),
  validate(phongValidation.updateRoomStatus),
  phongController.updateRoomStatus
);

export default router;
