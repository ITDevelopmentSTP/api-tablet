import axios from '../../../config/axiosPatio.js'

export async function getCarByLicensePlate (req, res, next) {
  try {
    const response = await axios.post('getCarByLicensePlate', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function getCarsByAgency (req, res, next) {
  try {
    const response = await axios.post('getCarsByAgency', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function getCarForMovement (req, res, next) {
  try {
    const response = await axios.post('getCarForMovement', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function saveCarMovement (req, res, next) {
  try {
    const response = await axios.post('saveCarMovement', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function saveCarInventory (req, res, next) {
  try {
    const response = await axios.post('saveCarInventory', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}
