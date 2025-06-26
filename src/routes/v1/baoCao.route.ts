// src/routes/v1/baoCao.route.ts
import express from 'express';
import {
  createBaoCao,
  deleteBaoCao,
  getBaoCaoByPhong,
  getBaoCaoDetails,
  getBaoCaoList,
  getBaoCaoStats,
  getUserBaoCao,
  updateTrangThaiBaoCao
} from '../../controllers/baoCao.controller';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import {
  createBaoCao as createBaoCaoValidation,
  deleteBaoCao as deleteBaoCaoValidation,
  getBaoCaoByPhong as getBaoCaoByPhongValidation,
  getBaoCaoDetails as getBaoCaoDetailsValidation,
  getBaoCaoList as getBaoCaoListValidation,
  updateTrangThaiBaoCao as updateTrangThaiBaoCaoValidation
} from '../../validations/baoCao.validation';

const router = express.Router();

// User routes
router
  .route('/')
  .post(auth(), validate(createBaoCaoValidation), createBaoCao) // Create report
  .get(auth('manageReports'), validate(getBaoCaoListValidation), getBaoCaoList); // Admin: Get all reports

router.route('/my-reports').get(auth(), getUserBaoCao); // Get user's own reports

router.route('/stats').get(auth('manageReports'), getBaoCaoStats); // Admin: Get report statistics

router
  .route('/phong/:maPhong')
  .get(auth('manageReports'), validate(getBaoCaoByPhongValidation), getBaoCaoByPhong); // Admin: Get reports by room

router
  .route('/:maBaoCao')
  .get(auth('manageReports'), validate(getBaoCaoDetailsValidation), getBaoCaoDetails) // Admin: Get report details
  .patch(auth('manageReports'), validate(updateTrangThaiBaoCaoValidation), updateTrangThaiBaoCao) // Admin: Update report status
  .delete(auth('manageReports'), validate(deleteBaoCaoValidation), deleteBaoCao); // Admin: Delete report

export default router;
