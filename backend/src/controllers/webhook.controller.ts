import { Request, Response } from 'express';
import { db } from '../database/memory-db';
import { logger } from '../utils/logger';
import { io } from '../index';

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class WebhookController {
  handleMeituanWebhook = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      logger.info('收到美团webhook:', data);

      const order = await this.processUpstreamOrder('meituan', data);

      if (order) {
        io.emit('order:created', order);
      }

      res.json({ code: 0, message: 'success' });
    } catch (error) {
      logger.error('处理美团webhook失败:', error);
      res.status(500).json({ code: -1, message: 'error' });
    }
  };

  handleTaobaoWebhook = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      logger.info('收到淘宝webhook:', data);

      const order = await this.processUpstreamOrder('taobao', data);

      if (order) {
        io.emit('order:created', order);
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('处理淘宝webhook失败:', error);
      res.status(500).json({ success: false });
    }
  };

  handleDouyinWebhook = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      logger.info('收到抖音webhook:', data);

      const order = await this.processUpstreamOrder('douyin', data);

      if (order) {
        io.emit('order:created', order);
      }

      res.json({ err_no: 0, err_tips: 'success' });
    } catch (error) {
      logger.error('处理抖音webhook失败:', error);
      res.status(500).json({ err_no: -1, err_tips: 'error' });
    }
  };

  handleDadaWebhook = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      logger.info('收到达达webhook:', data);

      await this.processDeliveryUpdate('dada', data);

      res.json({ status: 'success' });
    } catch (error) {
      logger.error('处理达达webhook失败:', error);
      res.status(500).json({ status: 'error' });
    }
  };

  handleSFWebhook = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      logger.info('收到顺丰webhook:', data);

      await this.processDeliveryUpdate('sf', data);

      res.json({ success: true });
    } catch (error) {
      logger.error('处理顺丰webhook失败:', error);
      res.status(500).json({ success: false });
    }
  };

  handleShansongWebhook = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      logger.info('收到闪送webhook:', data);

      await this.processDeliveryUpdate('shansong', data);

      res.json({ code: 200, msg: 'success' });
    } catch (error) {
      logger.error('处理闪送webhook失败:', error);
      res.status(500).json({ code: 500, msg: 'error' });
    }
  };

  private async processUpstreamOrder(source: string, data: any): Promise<any | null> {
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = {
      id: uuid(),
      orderNo,
      source,
      sourceOrderId: data.orderId || data.order_id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.orders.push(order);
    return order;
  }

  private async processDeliveryUpdate(platform: string, data: any): Promise<void> {
    const order = db.orders.find(o => o.deliveryOrderId === (data.orderId || data.order_id));

    if (order) {
      io.emit('order:delivery-update', { order, update: data });
    }
  }
}
