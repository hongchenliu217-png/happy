import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDb } from './database/memory-db';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info(`客户端连接: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`客户端断开: ${socket.id}`);
  });
});

export { io };

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    logger.info('数据库初始化成功');
    httpServer.listen(PORT, () => {
      logger.info(`服务器运行在端口 ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('数据库初始化失败:', error);
    process.exit(1);
  });
