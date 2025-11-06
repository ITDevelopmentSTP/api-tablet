import { Router } from 'express'
import { zonesController } from './controller.js'

const router = Router()

router.post('/toll', zonesController.registerTolls)
router.post('/test', zonesController.testConnection)

export default router
