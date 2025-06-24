// src/socket/socket.server.ts
import { NGUOIDUNG as User } from '@prisma/client';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Socket, Server as SocketIOServer } from 'socket.io';
import prisma from '../client';
import config from '../config';
import logger from '../config/logger';
import phienTrinhChieuHandler from './handlers/phienTrinhChieu.handler';

interface AuthenticatedSocket extends Socket {
  user?: User;
  phienId?: string;
}

class SocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin
          if (!origin) return callback(null, true);

          // In development, allow all origins
          if (config.env === 'development') {
            return callback(null, true);
          }

          // In production, check against allowed origins
          const allowedOrigins = [
            config.appUrl.client,
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080'
          ];

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST']
      },
      allowEIO3: true, // Allow different Socket.IO versions
      transports: ['polling', 'websocket'] // Explicitly set transports
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          // Allow anonymous users for public rooms
          return next();
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret) as any;

        if (decoded.type !== 'ACCESS') {
          return next(new Error('Invalid token type'));
        }

        // Get user from database
        const user = await prisma.nGUOIDUNG.findUnique({
          where: { maNguoiDung: decoded.sub },
          select: {
            maNguoiDung: true,
            hoTen: true,
            email: true,
            matKhau: true,
            anhDaiDien: true,
            quyen: true,
            trangThai: true,
            daXacThucEmail: true,
            ngayTao: true,
            ngayCapNhat: true
          }
        });

        if (!user || user.trangThai !== 'HOAT_DONG') {
          return next(new Error('User not found or inactive'));
        }

        socket.user = user;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.user?.maNguoiDung || 'anonymous';
      logger.info(`User ${userId} connected`);

      // Setup handlers for presentation sessions
      phienTrinhChieuHandler(socket, this.io);

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected`);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for user ${userId}:`, error);
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketServer;
