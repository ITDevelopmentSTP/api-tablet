import axios from '../../../config/axiosPatio.js'

export async function getAgencies (req, res, next) {
  try {
    const response = await axios.get('getAgencies')

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}

export async function storeTaskTimer (req, res, next) {
  try {
    const response = await axios.post('storeTaskTimer', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}
