import { Router } from 'express'
import { login, validateEmployee } from './controller.js'

const router = Router()

router
  .post('/login', login)
  .post('/validateEmployee', validateEmployee)

export default router
