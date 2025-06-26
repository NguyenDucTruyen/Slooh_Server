// src/controllers/baoCao.controller.ts
import { TrangThaiBaoCao, NGUOIDUNG as User } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import baoCaoService from '../services/baoCao.service';
import catchAsync from '../utils/catchAsync';

// Create a new report
const createBaoCao = catchAsync(async (req: Request, res: Response) => {
  const { maPhong, noiDung, hinhAnh } = req.body;
  const user = req.user as User;

  if (!user) {
    res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  const result = await baoCaoService.createBaoCao(user.maNguoiDung, maPhong, noiDung, hinhAnh);

  res.status(result.statusCode).json(result);
});

// Get list of reports (Admin only)
const getBaoCaoList = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const trangThai = req.query.trangThai as TrangThaiBaoCao;
  const search = req.query.search as string;

  const result = await baoCaoService.getBaoCaoList(page, limit, trangThai, search);

  res.status(result.statusCode).json(result);
});

// Get report details (Admin only)
const getBaoCaoDetails = catchAsync(async (req: Request, res: Response) => {
  const { maBaoCao } = req.params;

  const result = await baoCaoService.getBaoCaoDetails(maBaoCao);

  res.status(result.statusCode).json(result);
});

// Update report status (Admin only)
const updateTrangThaiBaoCao = catchAsync(async (req: Request, res: Response) => {
  const { maBaoCao } = req.params;
  const { trangThai } = req.body;

  const result = await baoCaoService.updateTrangThaiBaoCao(maBaoCao, trangThai);

  res.status(result.statusCode).json(result);
});

// Delete report (Admin only)
const deleteBaoCao = catchAsync(async (req: Request, res: Response) => {
  const { maBaoCao } = req.params;

  const result = await baoCaoService.deleteBaoCao(maBaoCao);

  res.status(result.statusCode).json(result);
});

// Get reports by room (Admin only)
const getBaoCaoByPhong = catchAsync(async (req: Request, res: Response) => {
  const { maPhong } = req.params;

  const result = await baoCaoService.getBaoCaoByPhong(maPhong);

  res.status(result.statusCode).json(result);
});

// Get report statistics (Admin only)
const getBaoCaoStats = catchAsync(async (req: Request, res: Response) => {
  const result = await baoCaoService.getBaoCaoStats();

  res.status(result.statusCode).json(result);
});

// Get user's own reports
const getUserBaoCao = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as User;

  if (!user) {
    res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  const result = await baoCaoService.getUserBaoCao(user.maNguoiDung);

  res.status(result.statusCode).json(result);
});

export {
  createBaoCao,
  deleteBaoCao,
  getBaoCaoByPhong,
  getBaoCaoDetails,
  getBaoCaoList,
  getBaoCaoStats,
  getUserBaoCao,
  updateTrangThaiBaoCao
};
