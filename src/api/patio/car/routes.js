import { Router } from 'express'
import {
  getCar,
  getCarByLicensePlate,
  getCarForMovement,
  getCarsByAgency,
  saveCarMovement,
  saveCarInventory
} from './controller.js'

const router = Router()

router
  .post('/getCar', getCar)
  .post('/getCarByLicensePlate', getCarByLicensePlate)
  .post('/getCarsByAgency', getCarsByAgency)
  .post('/getCarForMovement', getCarForMovement)
  .post('/saveCarMovement', saveCarMovement)
  .post('/saveCarInventory', saveCarInventory)

export default router
