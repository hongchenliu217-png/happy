import { Router } from 'express';
import authRoutes from './auth.routes';
import orderRoutes from './order.routes';
import platformRoutes from './platform.routes';
import statisticsRoutes from './statistics.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/platforms', platformRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/webhooks', webhookRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
