import axios from '../../../config/axiosPatio.js'
import Geotab from '../util/Geotab.js'

export async function getFredByLicensePlate (req, res, next) {
  try {
    const response = await axios.post('getFredByLicensePlate', req.body)

    // Crear instancia de Geotab
    const objGeotab = new Geotab(req.body.placa)
    // Obtener datos de odometro y combustible
    const KmResponse = await objGeotab.fetchGeotabData('GetOdometer')
    if (KmResponse) response.data.km = KmResponse.data.km // Asignar odómetro en caso de que la solicitud sea exitosa
    const FuelResponse = await objGeotab.fetchGeotabData('GetFuelStatus')
    if (FuelResponse) response.data.gas = FuelResponse.data.fraction // Asignar nivel de combustible en caso de que la solicitud sea exitosa
    // De no ser exitosas, los valores se mantienenen a los anteriormente definidos

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

/**
 * Methods 👇 (Not controllers)
*/

export async function uploadFredImage (dir = '', base64 = '', fileName = 'fred') {
  const replacedDir = dir.replace(/\//g, '\\')
  const mime = base64.match(/^data:(.*?);base64,/)[1]
  const extension = mime.split('/')[1]
  const cleanedBase64 = base64.replace(/^data:(.*?);base64,/, '')

  const data = {
    dir: replacedDir,
    fileName,
    fileExtension: '.' + extension,
    base64: cleanedBase64
  }

  try {
    const response = await axios.post('uploadFredImage', data)

    return response.data
  } catch (error) {
    console.error(error)
  }
}

export async function getFredImage (dir = '', fileName = 'fred', fileExtension = 'png') {
  const data = {
    dir: dir.replace(/\//g, '\\'),
    fileName,
    fileExtension: '.' + fileExtension
  }

  try {
    const base64 = await axios.post('getFredImage', data)
    const formattedBase64 = `data:image/png;base64,${base64.data.image}`

    return formattedBase64
  } catch (error) {
    console.error(error)
  }
}
