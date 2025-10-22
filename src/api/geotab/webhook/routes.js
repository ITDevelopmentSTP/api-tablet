import { Router } from 'express'
import { WebhookController } from './controller.js'

const router = Router()

router.post('/test', WebhookController.handleTest)

export default router
