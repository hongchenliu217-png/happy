import { Request, Response } from 'express';
import { db } from '../database/memory-db';
import { logger } from '../utils/logger';

export class PlatformController {
  getPlatforms = async (req: Request, res: Response) => {
    try {
      const { type } = req.query;

      let platforms = db.platforms;

      if (type) {
        platforms = platforms.filter(p => p.type === type);
      }

      platforms.sort((a, b) => b.priority - a.priority);

      res.json(platforms);
    } catch (error) {
      logger.error('获取平台列表失败:', error);
      res.status(500).json({ message: '获取平台列表失败' });
    }
  };

  getPlatformById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const platform = db.platforms.find(p => p.id === id);

      if (!platform) {
        return res.status(404).json({ message: '平台不存在' });
      }

      res.json(platform);
    } catch (error) {
      logger.error('获取平台详情失败:', error);
      res.status(500).json({ message: '获取平台详情失败' });
    }
  };

  createPlatform = async (req: Request, res: Response) => {
    try {
      const platform = {
        id: Date.now().toString(),
        ...req.body
      };
      db.platforms.push(platform);

      res.status(201).json({ message: '平台创建成功', platform });
    } catch (error) {
      logger.error('创建平台失败:', error);
      res.status(500).json({ message: '创建平台失败' });
    }
  };

  updatePlatform = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const platform = db.platforms.find(p => p.id === id);

      if (platform) {
        Object.assign(platform, req.body);
      }

      res.json({ message: '平台更新成功' });
    } catch (error) {
      logger.error('更新平台失败:', error);
      res.status(500).json({ message: '更新平台失败' });
    }
  };

  deletePlatform = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const index = db.platforms.findIndex(p => p.id === id);

      if (index > -1) {
        db.platforms.splice(index, 1);
      }

      res.json({ message: '平台删除成功' });
    } catch (error) {
      logger.error('删除平台失败:', error);
      res.status(500).json({ message: '删除平台失败' });
    }
  };
}
