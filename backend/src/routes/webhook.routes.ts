import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();
const webhookController = new WebhookController();

router.post('/meituan', webhookController.handleMeituanWebhook);
router.post('/taobao', webhookController.handleTaobaoWebhook);
router.post('/douyin', webhookController.handleDouyinWebhook);
router.post('/dada', webhookController.handleDadaWebhook);
router.post('/sf', webhookController.handleSFWebhook);
router.post('/shansong', webhookController.handleShansongWebhook);

export default router;
