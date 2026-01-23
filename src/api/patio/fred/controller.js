import axios from '../../../config/axiosPatio.js'
import Geotab from '../../class/Geotab.js'
import FTPManager from '../../class/FTPManager.js'

export async function getFredByLicensePlate (req, res, next) {
  try {
    const response = await axios.post('getFredByLicensePlate', req.body)

    // Crear instancia de Geotab
    const objGeotab = new Geotab(response.data.placa)
    // Obtener datos de odometro y combustible
    const geotabData = await objGeotab.fetchCarData()
    if (geotabData.odometer.geotab) {
      response.data.km = geotabData.odometer.km // Asignar odómetro en caso de que la solicitud sea exitosa
    } else {
      geotabData.odometer.km = response.data.km // Mantener el valor anterior si la solicitud falla
    }
    if (geotabData.fuel.geotab) {
      response.data.gas = geotabData.fuel.gas // Asignar nivel de combustible en caso de que la solicitud sea exitosa
    } else {
      geotabData.fuel.gas = response.data.gas // Mantener el valor anterior si la solicitud falla
    }
    // De no ser exitosas, los valores se mantienenen a los anteriormente definidos

    response.data.geotab = geotabData // Agregar los datos de Geotab a la respuesta

    let formattedBase64 = null

    if (response.data.car_img) {
      formattedBase64 = await getFredImage(response.data.car_img, 'fred', 'png')
    }

    return res.json({
      ...response.data,
      fred: formattedBase64
    })
  } catch (error) {
    next(error)
  }
}

export async function saveFred (req, res, next) {
  try {
    const response = await axios.post('saveFred', req.body)

    const isSaved = response.data.message === 'success'

    if (!isSaved) return res.status(400).json({ message: 'No se pudo guardar el registro de Fred.' })

    /**
     * Image Handling
    */

    await uploadFredImage(response.data.directorio, req.body.image, 'fred') // is always uploaded

    const imageKeys = [
      {
        key: 'image1',
        fileName: 'img1'
      },
      {
        key: 'image2',
        fileName: 'img2'
      },
      {
        key: 'image3',
        fileName: 'img3'
      },
      {
        key: 'image4',
        fileName: 'img4'
      },
      {
        key: 'image5',
        fileName: 'img5'
      },
      {
        key: 'firmaFredd',
        fileName: 'Firma_Digital'
      }
    ]

    for (const { key, fileName } of imageKeys) {
      if (req.body[key]) {
        await uploadFredImage(response.data.directorio, req.body[key], fileName)
      }
    }

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function sendFredEmail (req, res, next) {
  try {
    if (req.body.firmaFredd) {
      await uploadFredImage(req.body.ruta, req.body.firmaFredd, 'Firma_Digital')
    }

    const response = await axios.post('sendFredEmail', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function uploadFredImage (dir = '', base64 = '', fileName = 'fred') {
  const uploader = new FTPManager({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: process.env.FTP_PORT
  })
  const options = {
    createDirectories: true
  }
  try {
    const result = await uploader.postFTP(base64, dir, fileName, options)
    return result
  } catch (error) {
    console.error('FTP upload failed:', error.message)
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
