import { Router } from 'express'
import { getAgencies, storeTaskTimer } from './controller.js'

const router = Router()

router
  .get('/getAgencies', getAgencies)
  .post('/storeTaskTimer', storeTaskTimer)

export default router
