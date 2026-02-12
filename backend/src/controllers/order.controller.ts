import { Request, Response } from 'express';
import { db } from '../database/memory-db';
import { DeliveryService } from '../services/delivery.service';
import { logger } from '../utils/logger';
import { io } from '../index';

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class OrderController {
  private deliveryService = new DeliveryService();

  createOrder = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const orderData = req.body;

      const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = {
        id: uuid(),
        orderNo,
        merchantId: userId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...orderData
      };

      db.orders.push(order);
      io.emit('order:created', order);

      res.status(201).json({
        message: '订单创建成功',
        order
      });
    } catch (error) {
      logger.error('创建订单失败:', error);
      res.status(500).json({ message: '创建订单失败' });
    }
  };

  getOrders = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { status, source, page = 1, limit = 20 } = req.query;

      let orders = db.orders.filter(o => o.merchantId === userId);

      if (status) {
        orders = orders.filter(o => o.status === status);
      }

      if (source) {
        orders = orders.filter(o => o.source === source);
      }

      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const start = (Number(page) - 1) * Number(limit);
      const paginatedOrders = orders.slice(start, start + Number(limit));

      res.json({
        orders: paginatedOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: orders.length,
          totalPages: Math.ceil(orders.length / Number(limit))
        }
      });
    } catch (error) {
      logger.error('获取订单列表失败:', error);
      res.status(500).json({ message: '获取订单列表失败' });
    }
  };

  getOrderById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const order = db.orders.find(o => o.id === id && o.merchantId === userId);

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      res.json(order);
    } catch (error) {
      logger.error('获取订单详情失败:', error);
      res.status(500).json({ message: '获取订单详情失败' });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req as any).user.userId;

      const order = db.orders.find(o => o.id === id && o.merchantId === userId);

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      order.status = status;
      order.updatedAt = new Date();

      io.emit('order:updated', order);

      res.json({ message: '订单状态更新成功', order });
    } catch (error) {
      logger.error('更新订单状态失败:', error);
      res.status(500).json({ message: '更新订单状态失败' });
    }
  };

  setMealReady = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const order = db.orders.find(o => o.id === id && o.merchantId === userId);

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      order.status = 'ready';
      order.mealReadyTime = new Date();
      order.updatedAt = new Date();

      io.emit('order:meal-ready', order);

      res.json({ message: '出餐完成', order });
    } catch (error) {
      logger.error('设置出餐状态失败:', error);
      res.status(500).json({ message: '设置出餐状态失败' });
    }
  };

  dispatchOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { platform } = req.body;
      const userId = (req as any).user.userId;

      const order = db.orders.find(o => o.id === id && o.merchantId === userId);

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      const result = await this.deliveryService.dispatchOrder(order, platform);

      order.deliveryType = 'third_party';
      order.deliveryPlatform = platform;
      order.deliveryOrderId = result.deliveryOrderId;
      order.status = 'dispatched';
      order.dispatchedAt = new Date();
      order.updatedAt = new Date();

      io.emit('order:dispatched', order);

      res.json({ message: '订单派送成功', order, deliveryInfo: result });
    } catch (error) {
      logger.error('派送订单失败:', error);
      res.status(500).json({ message: '派送订单失败' });
    }
  };

  setSelfDelivery = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const order = db.orders.find(o => o.id === id && o.merchantId === userId);

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      order.deliveryType = 'self_delivery';
      order.status = 'dispatched';
      order.dispatchedAt = new Date();
      order.updatedAt = new Date();

      io.emit('order:self-delivery', order);

      res.json({ message: '已设置为自配送', order });
    } catch (error) {
      logger.error('设置自配送失败:', error);
      res.status(500).json({ message: '设置自配送失败' });
    }
  };

  cancelOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const order = db.orders.find(o => o.id === id && o.merchantId === userId);

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      order.status = 'cancelled';
      order.updatedAt = new Date();

      io.emit('order:cancelled', order);

      res.json({ message: '订单已取消', order });
    } catch (error) {
      logger.error('取消订单失败:', error);
      res.status(500).json({ message: '取消订单失败' });
    }
  };
}
