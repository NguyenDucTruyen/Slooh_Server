// src/services/phienTrinhChieu.service.ts
import { HoatDongPhong } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import { createErrorResponse, createSuccessResponse } from '../helpers/CreateResponse.helper';
import { ServiceResponse } from '../interfaces/ServiceResponse.interface';
import phienTrinhChieuRepository from '../repositories/phienTrinhChieu.repository';
import phongRepository from '../repositories/phong.repository';
import kenhService from './kenh.service';

class PhienTrinhChieuService {
  // Create new presentation session
  async createPhien(maPhong: string, maNguoiDung: string): Promise<ServiceResponse> {
    try {
      // Check if room exists
      const room = await phongRepository.getRoomById(maPhong);
      if (!room) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
      }

      // Check permission
      if (room.maKenh) {
        // Channel room - check if user is channel owner
        const isOwner = await kenhService.checkIsChannelOwner(room.maKenh, maNguoiDung);
        if (!isOwner) {
          return createErrorResponse(
            httpStatus.FORBIDDEN,
            'Chỉ chủ kênh mới có thể tạo phiên trình chiếu.'
          );
        }
      } else {
        // Public room - check if user is room creator
        if (room.maNguoiTao !== maNguoiDung) {
          return createErrorResponse(
            httpStatus.FORBIDDEN,
            'Chỉ người tạo phòng mới có thể tạo phiên trình chiếu.'
          );
        }
      }

      // Check if there's already an active session
      const activeSession = await phienTrinhChieuRepository.getActivePhienByRoom(maPhong);
      if (activeSession) {
        // Delete the active session before creating a new one
        await phienTrinhChieuRepository.deletePhien(activeSession.maPhien);
        console.log('Deleted existing active session:', activeSession.maPhien);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update room status to PRESENTING
        await tx.pHONG.update({
          where: { maPhong },
          data: { hoatDong: HoatDongPhong.PRESENTING }
        });

        // Create presentation session
        const phien = await phienTrinhChieuRepository.createPhien(maPhong, maNguoiDung);

        // Update host member name and avatar
        if (phien.thanhVien[0] && phien.thanhVien[0].nguoiDung) {
          await prisma.tHANHVIENPHIENTRINHCHIEU.update({
            where: { maThanhVienPhien: phien.thanhVien[0].maThanhVienPhien },
            data: {
              tenThanhVien: phien.thanhVien[0].nguoiDung.hoTen,
              anhDaiDien: phien.thanhVien[0].nguoiDung.anhDaiDien
            }
          });
        }

        return phien;
      });

      return createSuccessResponse(httpStatus.CREATED, 'Tạo phiên trình chiếu thành công.', {
        maPhien: result.maPhien,
        maPin: result.maPin,
        phong: result.phong
      });
    } catch (error) {
      console.error('Lỗi tạo phiên trình chiếu:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể tạo phiên trình chiếu.'
      );
    }
  }

  // Join session by PIN
  async joinPhienByPin(
    maPin: string,
    tenThanhVien: string,
    maNguoiDung?: string,
    anhDaiDien?: string
  ): Promise<ServiceResponse> {
    try {
      // Get session by PIN
      const phien = await phienTrinhChieuRepository.getPhienByPin(maPin);
      if (!phien) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phiên với mã PIN này.');
      }

      // Check if room is public or user has permission
      if (phien.phong.maKenh && maNguoiDung) {
        // Channel room - check if user is member
        const isMember = await phienTrinhChieuRepository.isUserChannelMember(
          maNguoiDung,
          phien.phong.maKenh
        );
        if (!isMember) {
          return createErrorResponse(
            httpStatus.FORBIDDEN,
            'Bạn phải là thành viên của kênh để tham gia phiên này.'
          );
        }
      }

      // Add member to session
      const member = await phienTrinhChieuRepository.addMemberToPhien(
        phien.maPhien,
        tenThanhVien,
        maNguoiDung,
        anhDaiDien
      );

      return createSuccessResponse(httpStatus.OK, 'Tham gia phiên thành công.', {
        maPhien: phien.maPhien,
        maThanhVienPhien: member.maThanhVienPhien,
        phong: phien.phong,
        isHost: false
      });
    } catch (error) {
      console.error('Lỗi tham gia phiên:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể tham gia phiên.');
    }
  }

  // Get session details
  async getPhienDetails(maPhien: string, maNguoiDung?: string): Promise<ServiceResponse> {
    try {
      const phien = await phienTrinhChieuRepository.getPhienById(maPhien);
      if (!phien) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phiên.');
      }

      // Check if user has permission to view
      if (phien.phong.maKenh && maNguoiDung) {
        const isMember = await phienTrinhChieuRepository.isUserChannelMember(
          maNguoiDung,
          phien.phong.maKenh
        );
        if (!isMember) {
          return createErrorResponse(httpStatus.FORBIDDEN, 'Bạn không có quyền xem phiên này.');
        }
      }

      // Get user's member info if logged in
      let userMember = null;
      if (maNguoiDung) {
        userMember = phien.thanhVien.find((m) => m.maNguoiDung === maNguoiDung);
      }

      return createSuccessResponse(httpStatus.OK, 'Lấy thông tin phiên thành công.', {
        ...phien,
        userMember
      });
    } catch (error) {
      console.error('Lỗi lấy thông tin phiên:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể lấy thông tin phiên.'
      );
    }
  }

  // Submit answer
  async submitAnswer(
    maPhien: string,
    maThanhVienPhien: string,
    maLuaChon: string,
    thoiGian: number
  ): Promise<ServiceResponse> {
    try {
      // Verify member belongs to session
      const phien = await phienTrinhChieuRepository.getPhienById(maPhien);
      if (!phien) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phiên.');
      }

      const member = phien.thanhVien.find((m) => m.maThanhVienPhien === maThanhVienPhien);
      if (!member) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'Bạn không phải thành viên của phiên này.'
        );
      }

      // Submit answer
      const answer = await phienTrinhChieuRepository.submitAnswer(
        maThanhVienPhien,
        maLuaChon,
        thoiGian
      );

      // Calculate points if answer is correct
      if (answer.luaChon.ketQua) {
        const basePoints = 1000;
        const timeBonus = Math.max(0, 1000 - thoiGian * 50); // Lose 50 points per second
        const totalPoints = basePoints + timeBonus;

        await phienTrinhChieuRepository.updateMemberScore(maThanhVienPhien, totalPoints);
      }

      return createSuccessResponse(httpStatus.OK, 'Gửi câu trả lời thành công.', {
        correct: answer.luaChon.ketQua
      });
    } catch (error) {
      console.error('Lỗi gửi câu trả lời:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể gửi câu trả lời.');
    }
  }

  // Get leaderboard
  async getLeaderboard(maPhien: string): Promise<ServiceResponse> {
    try {
      const leaderboard = await phienTrinhChieuRepository.getLeaderboard(maPhien);

      const formattedLeaderboard = leaderboard.map((member, index) => ({
        rank: index + 1,
        tenThanhVien: member.tenThanhVien,
        anhDaiDien: member.anhDaiDien,
        tongDiem: member.tongDiem,
        isUser: member.maNguoiDung ? true : false
      }));

      return createSuccessResponse(
        httpStatus.OK,
        'Lấy bảng xếp hạng thành công.',
        formattedLeaderboard
      );
    } catch (error) {
      console.error('Lỗi lấy bảng xếp hạng:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy bảng xếp hạng.');
    }
  }

  // End session
  async endPhien(maPhien: string, maNguoiDung: string): Promise<ServiceResponse> {
    try {
      // Check if user is host
      const isHost = await phienTrinhChieuRepository.isSessionHost(maPhien, maNguoiDung);
      if (!isHost) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'Chỉ chủ phiên mới có thể kết thúc phiên.'
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const phien = await tx.pHIENTRINHCHIEU.findUnique({
          where: { maPhien },
          include: { phong: true }
        });

        if (!phien) {
          throw new Error('Không tìm thấy phiên.');
        }

        // Update room status back to OFFLINE
        await tx.pHONG.update({
          where: { maPhong: phien.maPhong },
          data: { hoatDong: HoatDongPhong.OFFLINE }
        });

        // Delete session
        await phienTrinhChieuRepository.deletePhien(maPhien);

        return phien;
      });

      return createSuccessResponse(httpStatus.OK, 'Kết thúc phiên thành công.', {
        finalLeaderboard: result
      });
    } catch (error) {
      console.error('Lỗi kết thúc phiên:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể kết thúc phiên.');
    }
  }

  // Leave session
  async leavePhien(maThanhVienPhien: string): Promise<ServiceResponse> {
    try {
      await phienTrinhChieuRepository.removeMemberFromPhien(maThanhVienPhien);
      return createSuccessResponse(httpStatus.OK, 'Rời phiên thành công.');
    } catch (error) {
      console.error('Lỗi rời phiên:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể rời phiên.');
    }
  }

  // Get session by PIN (for preview)
  async getPhienByPin(maPin: string): Promise<ServiceResponse> {
    try {
      const phien = await phienTrinhChieuRepository.getPhienByPin(maPin);
      if (!phien) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phiên với mã PIN này.');
      }

      // Return basic info only (not full details to protect privacy)
      return createSuccessResponse(httpStatus.OK, 'Lấy thông tin phiên thành công.', {
        maPhien: phien.maPhien,
        tenPhong: phien.phong.tenPhong,
        isPublic: !phien.phong.maKenh,
        soThanhVien: phien.thanhVien.length,
        soTrang: phien.phong.trangs.length
      });
    } catch (error) {
      console.error('Lỗi lấy thông tin phiên qua PIN:', error);
      return createErrorResponse(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể lấy thông tin phiên.'
      );
    }
  }

  // Check if user is session host
  async isSessionHost(maPhien: string, maNguoiDung: string): Promise<boolean> {
    try {
      return await phienTrinhChieuRepository.isSessionHost(maPhien, maNguoiDung);
    } catch (error) {
      console.error('Lỗi kiểm tra host:', error);
      return false;
    }
  }

  // Get PIN by room ID
  async getPinByRoomId(maPhong: string, maNguoiDung: string): Promise<ServiceResponse> {
    try {
      // Check if room exists
      const room = await phongRepository.getRoomById(maPhong);
      if (!room) {
        return createErrorResponse(httpStatus.NOT_FOUND, 'Không tìm thấy phòng.');
      }

      // Only allow for channel rooms
      if (!room.maKenh) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'Chức năng này chỉ áp dụng cho phòng trong kênh.'
        );
      }

      // Check if user is channel member
      const isMember = await phienTrinhChieuRepository.isUserChannelMember(
        maNguoiDung,
        room.maKenh
      );
      if (!isMember) {
        return createErrorResponse(
          httpStatus.FORBIDDEN,
          'Bạn phải là thành viên của kênh để xem mã PIN.'
        );
      }

      // Get active session for the room
      const activeSession = await phienTrinhChieuRepository.getActivePhienByRoom(maPhong);
      if (!activeSession) {
        return createErrorResponse(
          httpStatus.NOT_FOUND,
          'Không có phiên trình chiếu đang hoạt động cho phòng này.'
        );
      }

      return createSuccessResponse(httpStatus.OK, 'Lấy mã PIN thành công.', {
        maPin: activeSession.maPin
      });
    } catch (error) {
      console.error('Error getting PIN by room ID:', error);
      return createErrorResponse(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể lấy mã PIN.');
    }
  }
}

export default new PhienTrinhChieuService();
