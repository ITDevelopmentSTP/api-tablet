import axios from '../../../config/axiosPatio.js'

export async function getCierre (req, res, next) {
  try {
    const response = await axios.post('getCierre', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function closeContrato (req, res, next) {
  try {
    const response = await axios.post('closeContrato', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}
