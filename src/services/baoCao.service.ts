// src/services/baoCao.service.ts
import { TrangThaiBaoCao } from '@prisma/client';
import httpStatus from 'http-status';
import { createErrorResponse, createSuccessResponse } from '../helpers/CreateResponse.helper';
import { ServiceResponse } from '../interfaces/ServiceResponse.interface';
import baoCaoRepository from '../repositories/baoCao.repository';
import phienTrinhChieuRepository from '../repositories/phienTrinhChieu.repository';
import phongRepository from '../repositories/phong.repository';

class BaoCaoService {
  // Create a new report
  async createBaoCao(
    maNguoiDung: string,
    maPhong: string,
    noiDung: string,
    hinhAnh?: string
  ): Promise<ServiceResponse> {
    try {
      // Check if room exists
      const room = await phongRepository.getRoomById(maPhong);
      if (!room) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
      }

      // Check permission to report
      if (room.maKenh) {
        // Channel room - check if user is member
        const isMember = await phienTrinhChieuRepository.isUserChannelMember(
          maNguoiDung,
          room.maKenh
        );
        if (!isMember) {
          return createErrorResponse(
            httpStatus.FORBIDDEN,
            'Bạn phải là thành viên của kênh để báo cáo phòng này.'
          );
        }
      }
      // For public rooms (maKenh is null), anyone can report

      // Check if user already reported this room
      const existingReport = await baoCaoRepository.checkExistingReport(maNguoiDung, maPhong);
      if (existingReport) {
        return createErrorResponse(httpStatus.CONFLICT, 'Bạn đã báo cáo phòng này trước đó.');
      }

      // Create report
      const report = await baoCaoRepository.createBaoCao(maNguoiDung, maPhong, noiDung, hinhAnh);

      return createSuccessResponse(httpStatus.CREATED, 'Tạo báo cáo thành công.', report);
    } catch (error) {
      console.error('Lỗi tạo báo cáo:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tạo báo cáo.');
    }
  }

  // Get list of reports (Admin only)
  async getBaoCaoList(
    page: number = 1,
    limit: number = 10,
    trangThai?: TrangThaiBaoCao,
    search?: string
  ): Promise<ServiceResponse> {
    try {
      const result = await baoCaoRepository.getBaoCaoList(page, limit, trangThai, search);

      return createSuccessResponse(httpStatus.OK, 'Lấy danh sách báo cáo thành công.', result);
    } catch (error) {
      console.error('Lỗi lấy danh sách báo cáo:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể lấy danh sách báo cáo.'
      );
    }
  }

  // Get report details (Admin only)
  async getBaoCaoDetails(maBaoCao: string): Promise<ServiceResponse> {
    try {
      const report = await baoCaoRepository.getBaoCaoById(maBaoCao);
      if (!report) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy báo cáo.');
      }

      return createSuccessResponse(httpStatus.OK, 'Lấy chi tiết báo cáo thành công.', report);
    } catch (error) {
      console.error('Lỗi lấy chi tiết báo cáo:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể lấy chi tiết báo cáo.'
      );
    }
  }

  // Update report status (Admin only)
  async updateTrangThaiBaoCao(
    maBaoCao: string,
    trangThai: TrangThaiBaoCao
  ): Promise<ServiceResponse> {
    try {
      const existingReport = await baoCaoRepository.getBaoCaoById(maBaoCao);
      if (!existingReport) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy báo cáo.');
      }

      const updatedReport = await baoCaoRepository.updateTrangThaiBaoCao(maBaoCao, trangThai);

      return createSuccessResponse(
        httpStatus.OK,
        'Cập nhật trạng thái báo cáo thành công.',
        updatedReport
      );
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái báo cáo:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể cập nhật trạng thái báo cáo.'
      );
    }
  }

  // Delete report (Admin only)
  async deleteBaoCao(maBaoCao: string): Promise<ServiceResponse> {
    try {
      const existingReport = await baoCaoRepository.getBaoCaoById(maBaoCao);
      if (!existingReport) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy báo cáo.');
      }

      await baoCaoRepository.deleteBaoCao(maBaoCao);

      return createSuccessResponse(httpStatus.OK, 'Xóa báo cáo thành công.');
    } catch (error) {
      console.error('Lỗi xóa báo cáo:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể xóa báo cáo.');
    }
  }

  // Get reports by room (Admin only)
  async getBaoCaoByPhong(maPhong: string): Promise<ServiceResponse> {
    try {
      const room = await phongRepository.getRoomById(maPhong);
      if (!room) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
      }

      const reports = await baoCaoRepository.getBaoCaoByPhong(maPhong);

      return createSuccessResponse(httpStatus.OK, 'Lấy danh sách báo cáo theo phòng thành công.', {
        phong: {
          maPhong: room.maPhong,
          tenPhong: room.tenPhong,
          moTa: room.moTa
        },
        reports
      });
    } catch (error) {
      console.error('Lỗi lấy báo cáo theo phòng:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể lấy báo cáo theo phòng.'
      );
    }
  }

  // Get report statistics (Admin only)
  async getBaoCaoStats(): Promise<ServiceResponse> {
    try {
      const stats = await baoCaoRepository.getBaoCaoStats();

      return createSuccessResponse(httpStatus.OK, 'Lấy thống kê báo cáo thành công.', stats);
    } catch (error) {
      console.error('Lỗi lấy thống kê báo cáo:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể lấy thống kê báo cáo.'
      );
    }
  }

  // Get user's own reports
  async getUserBaoCao(maNguoiDung: string): Promise<ServiceResponse> {
    try {
      const reports = await baoCaoRepository.getBaoCaoList(1, 100, undefined, undefined);

      // Filter reports by user (temporary until we add user filter to repository)
      const userReports = reports.reports.filter((report) => report.maNguoiDung === maNguoiDung);

      return createSuccessResponse(
        httpStatus.OK,
        'Lấy danh sách báo cáo của người dùng thành công.',
        userReports
      );
    } catch (error) {
      console.error('Lỗi lấy báo cáo của người dùng:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể lấy báo cáo của người dùng.'
      );
    }
  }
}

export default new BaoCaoService();
