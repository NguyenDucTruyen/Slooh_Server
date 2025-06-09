// src/index.ts
import { createServer } from 'http';
import app from './app';
import prisma from './client';
import config from './config/config';
import logger from './config/logger';
import SocketServer from './socket/socket.server';

const httpServer = createServer(app);
let socketServer: SocketServer; 

prisma.$connect().then(() => {
  logger.info('Connected to SQL Database');

  // Initialize Socket.IO server
  socketServer = new SocketServer(httpServer);
  logger.info('Socket.IO server initialized');

  httpServer.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (httpServer) {
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (httpServer) {
    httpServer.close();
  }
});
