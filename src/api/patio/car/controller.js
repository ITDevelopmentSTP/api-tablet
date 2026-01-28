import axios from '../../../config/axiosPatio.js'
import Geotab from '../../class/Geotab.js'
import FTPManager from '../../class/FTPManager.js'

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
    const geotabData = await objGeotab.fetchCarData()
    if (geotabData.odometer.geotab) {
      response.data.Auto.KMS = geotabData.odometer.km // Asignar odómetro en caso de que la solicitud sea exitosa
    } else {
      geotabData.odometer.km = response.data.Auto.KMS // Mantener el valor anterior si la solicitud falla
    }
    if (geotabData.fuel.geotab) {
      response.data.Auto.Gas = geotabData.fuel.gas // Asignar nivel de combustible en caso de que la solicitud sea exitosa
    } else {
      geotabData.fuel.gas = response.data.Auto.Gas // Mantener el valor anterior si la solicitud falla
    }
    // De no ser exitosas, los valores se mantienenen a los anteriormente definidos
    response.data.Auto.geotab = geotabData // Agregar los datos de Geotab a la respuesta

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

export async function getCar (req, res, next) {
  try {
    const response = await axios.post('getCar', req.body)

    // Crear instancia de Geotab
    const objGeotab = new Geotab(response.data.placa)
    // Obtener datos de odometro y combustible
    const geotabData = await objGeotab.fetchCarData()
    if (geotabData.odometer.geotab) {
      response.data.lastFredd.km = geotabData.odometer.km // Asignar odómetro en caso de que la solicitud sea exitosa
    } else {
      geotabData.odometer.km = response.data.lastFredd.km // Mantener el valor anterior si la solicitud falla
    }
    if (geotabData.fuel.geotab) {
      response.data.lastFredd.gas = geotabData.fuel.gas // Asignar nivel de combustible en caso de que la solicitud sea exitosa
    } else {
      geotabData.fuel.gas = response.data.lastFredd.gas // Mantener el valor anterior si la solicitud falla
    }
    // De no ser exitosas, los valores se mantienenen a los anteriormente definidos
    response.data.lastFredd.geotab = geotabData // Agregar los datos de Geotab a la respuesta

    let formattedBase64 = null
    if (response.data.lastFredd.car_img) {
      formattedBase64 = await getFredImage(response.data.lastFredd.car_img, 'fred', 'png')
    }

    response.data.lastFredd.fred = formattedBase64
    return res.json({ ...response.data })
  } catch (error) {
    next(error)
  }
}

export async function getFredImage (dir = '', fileName = 'fred', fileExtension = 'png') {
  const downloader = new FTPManager({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: process.env.FTP_PORT
  })
  try {
    const result = await downloader.getFTP(dir, fileName, fileExtension)
    return result
  } catch (error) {
    console.error('FTP download failed:', error.message)
  }
}
