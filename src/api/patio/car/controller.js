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
    const KmResponse = await objGeotab.fetchOdometer()
    if (KmResponse.geotab) {
      response.data.Auto.KMS = KmResponse // Asignar odómetro en caso de que la solicitud sea exitosa
    } else {
      KmResponse.km = response.data.Auto.KMS
      response.data.Auto.KMS = KmResponse // Mantener el valor anterior si la solicitud falla
    }
    const FuelResponse = await objGeotab.fetchFuel()
    if (FuelResponse.geotab) {
      response.data.Auto.Gas = FuelResponse // Asignar nivel de combustible en caso de que la solicitud sea exitosa
    } else {
      FuelResponse.gas = response.data.Auto.Gas
      response.data.Auto.Gas = FuelResponse // Mantener el valor anterior si la solicitud falla
    }
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
