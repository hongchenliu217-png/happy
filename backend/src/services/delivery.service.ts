import { db } from '../database/memory-db';
import axios from 'axios';
import { logger } from '../utils/logger';

export class DeliveryService {
  async dispatchOrder(order: any, platformCode: string) {
    const platform = db.platforms.find(p => p.code === platformCode && p.type === 'downstream');

    if (!platform) {
      throw new Error('配送平台不存在');
    }

    // 模拟派单
    logger.info(`派送订单到${platform.name}:`, order.orderNo);

    return {
      deliveryOrderId: `DEL${Date.now()}`,
      fee: 8.5,
      distance: 3.2,
      estimatedTime: 30
    };
  }

  async notifyMealReady(order: any) {
    logger.info(`通知配送平台餐品已准备好:`, order.orderNo);
  }

  async cancelDelivery(order: any) {
    logger.info(`取消配送订单:`, order.orderNo);
  }
}
