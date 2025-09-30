import { Router } from 'express'
import { getCierre, closeContrato } from './controller.js'

const router = Router()

router
  .post('/getCierre', getCierre)
  .post('/closeContrato', closeContrato)

export default router
