import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const orderController = new OrderController();

router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/meal-ready', orderController.setMealReady);
router.post('/:id/dispatch', orderController.dispatchOrder);
router.post('/:id/self-delivery', orderController.setSelfDelivery);
router.delete('/:id', orderController.cancelOrder);

export default router;
