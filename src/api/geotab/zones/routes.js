import { Router } from 'express'
import { zonesController } from './controller.js'

const router = Router()

router.post('/toll', zonesController.registerTolls)
router.post('/process', zonesController.processData)

export default router
