import jwt from 'jsonwebtoken'
import axios from '../../../config/axiosPatio.js'
const { ACCESS_TOKEN_SECRET } = process.env

export async function login (req, res, next) {
  try {
    const { data } = await axios.post('login', req.body)

    if (data.error) {
      return res.status(401).json(data)
    }

    /**
     * Check secret tokens and
     * Configure JsonWebToken.
     */

    const payload = { num_emple: data.num_emple }
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET)

    return res.json({
      user: data,
      accessToken
    })
  } catch (error) {
    next(error)
  }
}

export async function validateEmployee (req, res, next) {
  try {
    const response = await axios.post('validateEmployee', req.body)

    return res.json(response.data)
  } catch (error) {
    next(error)
  }
}
