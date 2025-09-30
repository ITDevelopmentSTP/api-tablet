import { Router } from 'express'
import { getFredByLicensePlate, saveFred, sendFredEmail } from './controller.js'

const router = Router()

router
  .post('/getFredByLicensePlate', getFredByLicensePlate)
  .post('/saveFred', saveFred)
  .post('/sendFredEmail', sendFredEmail)

export default router
