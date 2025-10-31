import { Router } from 'express'
import webhookRoutes from './webhook/routes.js'
import zonesRoutes from './zones/routes.js'

const router = Router()

router.use('/webhook', webhookRoutes)
router.use('/zones', zonesRoutes)

export default router
