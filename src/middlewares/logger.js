// Logger middleware sencillo en ESM
// Registra método, ruta, IP y tiempo, y al finalizar la respuesta registra el código de estado.

export default function logger (req, res, next) {
  const start = Date.now()
  const timestamp = new Date().toISOString()
  const { method, originalUrl } = req
  const ip = req.ip || req.connection?.remoteAddress || 'unknown'

  console.log(`[${timestamp}] ${ip} -> ${method} ${originalUrl}`)

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(
      `[${timestamp}] ${method} ${originalUrl} ${res.statusCode} body: ${JSON.stringify(req.body)} - ${duration}ms`
    )
  })

  next()
}
