import { Router } from 'express'
import webhookRoutes from './webhook/routes.js'

const router = Router()

router.use('/webhook', webhookRoutes)

export default router
