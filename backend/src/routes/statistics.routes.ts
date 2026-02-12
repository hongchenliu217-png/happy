import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const statisticsController = new StatisticsController();

router.use(authMiddleware);

router.get('/dashboard', statisticsController.getDashboard);
router.get('/orders', statisticsController.getOrderStatistics);
router.get('/revenue', statisticsController.getRevenueStatistics);
router.get('/platforms', statisticsController.getPlatformStatistics);

export default router;
