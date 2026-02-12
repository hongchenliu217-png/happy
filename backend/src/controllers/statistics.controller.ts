import { Request, Response } from 'express';
import { db } from '../database/memory-db';
import { logger } from '../utils/logger';

export class StatisticsController {
  getDashboard = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userOrders = db.orders.filter(o => o.merchantId === userId);

      const todayOrders = userOrders.filter(o =>
        new Date(o.createdAt) >= today
      ).length;

      const completedOrders = userOrders.filter(o =>
        o.status === 'delivered' && new Date(o.createdAt) >= today
      ).length;

      const pendingOrders = userOrders.filter(o =>
        o.status === 'pending'
      ).length;

      const todayRevenue = userOrders
        .filter(o => o.status === 'delivered' && new Date(o.createdAt) >= today)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      res.json({
        todayOrders,
        completedOrders,
        pendingOrders,
        todayRevenue
      });
    } catch (error) {
      logger.error('获取仪表盘数据失败:', error);
      res.status(500).json({ message: '获取仪表盘数据失败' });
    }
  };

  getOrderStatistics = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { startDate, endDate } = req.query;

      const statistics = db.statistics.filter(s =>
        s.merchantId === userId &&
        new Date(s.date) >= new Date(startDate as string) &&
        new Date(s.date) <= new Date(endDate as string)
      );

      res.json(statistics);
    } catch (error) {
      logger.error('获取订单统计失败:', error);
      res.status(500).json({ message: '获取订单统计失败' });
    }
  };

  getRevenueStatistics = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { startDate, endDate } = req.query;

      const orders = db.orders.filter(o =>
        o.merchantId === userId &&
        o.status === 'delivered' &&
        new Date(o.createdAt) >= new Date(startDate as string) &&
        new Date(o.createdAt) <= new Date(endDate as string)
      );

      const groupedByDate: any = {};
      orders.forEach(o => {
        const date = new Date(o.createdAt).toISOString().split('T')[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = { date, revenue: 0, orderCount: 0 };
        }
        groupedByDate[date].revenue += o.totalAmount || 0;
        groupedByDate[date].orderCount += 1;
      });

      const result = Object.values(groupedByDate);

      res.json(result);
    } catch (error) {
      logger.error('获取营收统计失败:', error);
      res.status(500).json({ message: '获取营收统计失败' });
    }
  };

  getPlatformStatistics = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;

      const orders = db.orders.filter(o => o.merchantId === userId);

      const groupedByPlatform: any = {};
      orders.forEach(o => {
        const platform = o.source || 'unknown';
        if (!groupedByPlatform[platform]) {
          groupedByPlatform[platform] = { platform, orderCount: 0, revenue: 0 };
        }
        groupedByPlatform[platform].orderCount += 1;
        groupedByPlatform[platform].revenue += o.totalAmount || 0;
      });

      const result = Object.values(groupedByPlatform);

      res.json(result);
    } catch (error) {
      logger.error('获取平台统计失败:', error);
      res.status(500).json({ message: '获取平台统计失败' });
    }
  };
}
