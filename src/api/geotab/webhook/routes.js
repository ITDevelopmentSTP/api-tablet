import { Router } from 'express'
import { WebhookController } from './controller.js'

const router = Router()

router.post('/test', WebhookController.handleTest)
router.get('/test', WebhookController.handleGetTest)

export default router
