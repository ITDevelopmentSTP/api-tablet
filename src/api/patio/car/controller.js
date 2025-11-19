import axios from '../../../config/axiosPatio.js'
import Geotab from '../util/Geotab.js'

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

    // Crear instancia de Geotab
    const objGeotab = new Geotab(req.body.Auto)
    // Obtener datos de odometro y combustible
    const KmResponse = await objGeotab.fetchGeotabData('GetOdometer')
    if (KmResponse) response.data.Auto.KMS = KmResponse.data.km // Asignar odómetro en caso de que la solicitud sea exitosa
    const FuelResponse = await objGeotab.fetchGeotabData('GetFuelStatus')
    if (FuelResponse) response.data.Auto.Gas = FuelResponse.data.fraction // Asignar nivel de combustible en caso de que la solicitud sea exitosa
    // De no ser exitosas, los valores se mantienenen a los anteriormente definidos

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
