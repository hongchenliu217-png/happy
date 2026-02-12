import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('错误:', err);

  res.status(500).json({
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
