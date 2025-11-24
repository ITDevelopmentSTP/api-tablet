import axios from '../../../config/axiosPatio.js'
import Geotab from '../../class/Geotab.js'

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
    const objGeotab = new Geotab(response.data.Auto.Placa)
    // Obtener datos de odometro y combustible
    const geotabData = {}
    geotabData.odometer = await objGeotab.fetchOdometer()
    geotabData.fuel = await objGeotab.fetchFuel()
    if (geotabData.odometer.geotab) {
      response.data.Auto.KMS = geotabData.odometer.km // Asignar odómetro en caso de que la solicitud sea exitosa
    } else {
      geotabData.odometer.km = response.data.Auto.KMS // Mantener el valor anterior si la solicitud falla
    }
    if (geotabData.fuel.geotab) {
      response.data.Auto.Gas = geotabData.fuel // Asignar nivel de combustible en caso de que la solicitud sea exitosa
    } else {
      geotabData.fuel.gas = response.data.Auto.Gas // Mantener el valor anterior si la solicitud falla
    }
    // De no ser exitosas, los valores se mantienenen a los anteriormente definidos
    response.data.geotab = geotabData // Agregar los datos de Geotab a la respuesta

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
