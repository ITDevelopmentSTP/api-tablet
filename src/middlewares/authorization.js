import jwt from 'jsonwebtoken'
const { ACCESS_TOKEN_SECRET } = process.env

export function authorization (req, res, next) {
  const { authorization } = req.headers

  if (!authorization) {
    res.status(403).json({ error: true, message: "Cabecera de 'Authorization' requerida" })
    return
  }
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    res.status(403).json({ error: true, message: 'Token inválido' })
    return
  }

  const token = authorization.substring(7)

  try {
    // if (ACCESS_TOKEN_SECRET == null) throw new Error()

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET)

    req.num_emple = decoded.num_emple
    next()
  } catch (error) {
    next(error)
  }
}
