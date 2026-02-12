import { Router } from 'express';
import { PlatformController } from '../controllers/platform.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();
const platformController = new PlatformController();

router.use(authMiddleware);

router.get('/', platformController.getPlatforms);
router.get('/:id', platformController.getPlatformById);

router.use(adminMiddleware);
router.post('/', platformController.createPlatform);
router.put('/:id', platformController.updatePlatform);
router.delete('/:id', platformController.deletePlatform);

export default router;
