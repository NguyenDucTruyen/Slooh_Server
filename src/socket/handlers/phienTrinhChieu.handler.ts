// src/socket/handlers/phienTrinhChieu.handler.ts
import { Socket, Server as SocketIOServer } from 'socket.io';
import logger from '../../config/logger';
import phienTrinhChieuService from '../../services/phienTrinhChieu.service';
import { SocketEvent } from '../../types/socket.enum';

interface AuthenticatedSocket extends Socket {
  user?: any;
  phienId?: string;
  maThanhVienPhien?: string;
}

interface CreatePhienData {
  maPhong: string;
}

interface JoinPhienData {
  maPin: string;
  tenThanhVien?: string;
}

interface SubmitAnswerData {
  maLuaChon: string;
  thoiGian: number;
}

interface NavigateData {
  trangIndex: number;
}

interface StartQuestionData {
  trangIndex: number;
}

const phienTrinhChieuHandler = (socket: AuthenticatedSocket, io: SocketIOServer) => {
  // Create new presentation session
  socket.on(SocketEvent.CREATE_PHIEN, async (data: CreatePhienData, callback) => {
    try {
      if (!socket.user) {
        return callback({
          success: false,
          message: 'Bạn phải đăng nhập để tạo phiên trình chiếu.'
        });
      }

      const result = await phienTrinhChieuService.createPhien(
        data.maPhong,
        socket.user.maNguoiDung
      );

      if (result.success && result.data) {
        // Join socket room
        socket.join(`phien:${result.data.maPhien}`);
        socket.phienId = result.data.maPhien;
        socket.maThanhVienPhien = result.data.phong.thanhVien?.[0]?.maThanhVienPhien;

        // Notify room that session started
        io.to(`room:${data.maPhong}`).emit(SocketEvent.STARTED, {
          maPhien: result.data.maPhien,
          maPin: result.data.maPin
        });
      }

      callback(result);
    } catch (error) {
      logger.error('Error creating phien:', error);
      callback({
        success: false,
        message: 'Không thể tạo phiên trình chiếu.'
      });
    }
  });

  // Join session by PIN
  socket.on(SocketEvent.JOIN_PHIEN, async (data: JoinPhienData, callback) => {
    try {
      const tenThanhVien = data.tenThanhVien || socket.user?.hoTen || 'Khách';
      const maNguoiDung = socket.user?.maNguoiDung;
      const anhDaiDien = socket.user?.anhDaiDien;

      const result = await phienTrinhChieuService.joinPhienByPin(
        data.maPin,
        tenThanhVien,
        maNguoiDung,
        anhDaiDien
      );

      if (result.success && result.data) {
        // Join socket room
        socket.join(`phien:${result.data.maPhien}`);
        socket.phienId = result.data.maPhien;
        socket.maThanhVienPhien = result.data.maThanhVienPhien;

        // Notify others about new member
        socket.to(`phien:${result.data.maPhien}`).emit(SocketEvent.MEMBER_JOINED, {
          maThanhVienPhien: result.data.maThanhVienPhien,
          tenThanhVien,
          anhDaiDien
        });
      }

      callback(result);
    } catch (error) {
      logger.error('Error joining phien:', error);
      callback({
        success: false,
        message: 'Không thể tham gia phiên.'
      });
    }
  });

  // Navigate to page (host only)
  socket.on(SocketEvent.NAVIGATE, async (data: NavigateData) => {
    if (!socket.phienId) return;

    try {
      // Verify host
      const isHost = await phienTrinhChieuService.isSessionHost(
        socket.phienId,
        socket.user?.maNguoiDung
      );

      if (!isHost) {
        socket.emit(SocketEvent.ERROR, { message: 'Chỉ chủ phiên mới có thể điều khiển.' });
        return;
      }

      // Broadcast navigation to all members
      io.to(`phien:${socket.phienId}`).emit(SocketEvent.NAVIGATED, {
        trangIndex: data.trangIndex
      });
    } catch (error) {
      logger.error('Error navigating:', error);
    }
  });

  // Start question timer (host only)
  socket.on(SocketEvent.START_QUESTION, async (data: StartQuestionData) => {
    if (!socket.phienId) return;

    try {
      // Verify host
      const isHost = await phienTrinhChieuService.isSessionHost(
        socket.phienId,
        socket.user?.maNguoiDung
      );

      if (!isHost) {
        socket.emit(SocketEvent.ERROR, { message: 'Chỉ chủ phiên mới có thể bắt đầu câu hỏi.' });
        return;
      }

      // Broadcast question start to all members
      io.to(`phien:${socket.phienId}`).emit(SocketEvent.QUESTION_STARTED, {
        trangIndex: data.trangIndex,
        startTime: Date.now()
      });
    } catch (error) {
      logger.error('Error starting question:', error);
    }
  });

  // Submit answer
  socket.on(SocketEvent.SUBMIT_ANSWER, async (data: SubmitAnswerData, callback) => {
    if (!socket.phienId || !socket.maThanhVienPhien) {
      return callback({
        success: false,
        message: 'Bạn chưa tham gia phiên.'
      });
    }

    try {
      const result = await phienTrinhChieuService.submitAnswer(
        socket.phienId,
        socket.maThanhVienPhien,
        data.maLuaChon,
        data.thoiGian
      );

      // Notify host about answer submission
      socket.to(`phien:${socket.phienId}`).emit(SocketEvent.ANSWER_SUBMITTED, {
        maThanhVienPhien: socket.maThanhVienPhien
      });

      callback(result);
    } catch (error) {
      logger.error('Error submitting answer:', error);
      callback({
        success: false,
        message: 'Không thể gửi câu trả lời.'
      });
    }
  });

  // Show leaderboard (host only)
  socket.on(SocketEvent.SHOW_LEADERBOARD, async () => {
    if (!socket.phienId) return;

    try {
      // Verify host
      const isHost = await phienTrinhChieuService.isSessionHost(
        socket.phienId,
        socket.user?.maNguoiDung
      );

      if (!isHost) {
        socket.emit(SocketEvent.ERROR, {
          message: 'Chỉ chủ phiên mới có thể hiển thị bảng xếp hạng.'
        });
        return;
      }

      const result = await phienTrinhChieuService.getLeaderboard(socket.phienId);

      if (result.success) {
        io.to(`phien:${socket.phienId}`).emit(SocketEvent.LEADERBOARD, result.data);
      }
    } catch (error) {
      logger.error('Error showing leaderboard:', error);
    }
  });

  // End session (host only)
  socket.on(SocketEvent.END_PHIEN, async (callback) => {
    if (!socket.phienId) {
      return callback({
        success: false,
        message: 'Không tìm thấy phiên.'
      });
    }

    try {
      const result = await phienTrinhChieuService.endPhien(
        socket.phienId,
        socket.user?.maNguoiDung
      );

      if (result.success) {
        // Notify all members
        io.to(`phien:${socket.phienId}`).emit(SocketEvent.ENDED, {
          finalLeaderboard: result.data?.finalLeaderboard
        });

        // Remove all sockets from room
        const sockets = await io.in(`phien:${socket.phienId}`).fetchSockets();
        for (const s of sockets) {
          s.leave(`phien:${socket.phienId}`);
          (s as any).phienId = undefined;
          (s as any).maThanhVienPhien = undefined;
        }
      }

      callback(result);
    } catch (error) {
      logger.error('Error ending phien:', error);
      callback({
        success: false,
        message: 'Không thể kết thúc phiên.'
      });
    }
  });

  // Leave session
  socket.on(SocketEvent.LEAVE_PHIEN, async (callback) => {
    if (!socket.phienId || !socket.maThanhVienPhien) {
      return callback({
        success: false,
        message: 'Bạn chưa tham gia phiên.'
      });
    }

    try {
      const result = await phienTrinhChieuService.leavePhien(socket.maThanhVienPhien);

      if (result.success) {
        // Notify others
        socket.to(`phien:${socket.phienId}`).emit(SocketEvent.MEMBER_LEFT, {
          maThanhVienPhien: socket.maThanhVienPhien
        });

        // Leave socket room
        socket.leave(`phien:${socket.phienId}`);
        socket.phienId = undefined;
        socket.maThanhVienPhien = undefined;
      }

      callback(result);
    } catch (error) {
      logger.error('Error leaving phien:', error);
      callback({
        success: false,
        message: 'Không thể rời phiên.'
      });
    }
  });

  // Handle disconnect
  socket.on(SocketEvent.DISCONNECT, async () => {
    if (socket.phienId && socket.maThanhVienPhien) {
      try {
        // Remove member from session
        await phienTrinhChieuService.leavePhien(socket.maThanhVienPhien);

        // Notify others
        socket.to(`phien:${socket.phienId}`).emit(SocketEvent.MEMBER_LEFT, {
          maThanhVienPhien: socket.maThanhVienPhien
        });
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    }
  });
};

export default phienTrinhChieuHandler;
