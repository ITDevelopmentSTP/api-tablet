const ERROR_HANDLER = {
  /**
   * Axios Errors
   */

  ECONNABORTED: (res) => {
    res
      .status(504)
      .json({ error: true, message: 'Timeout: la solicitud tardó demasiado.' })
  },

  ECONNREFUSED: (res) => {
    res
      .status(502)
      .json({
        error: true,
        message: 'Conexión rechazada: el servicio no está disponible.'
      })
  },

  ENOTFOUND: (res) => {
    res
      .status(502)
      .json({ error: true, message: 'Host no encontrado: verifica la URL.' })
  },

  ETIMEDOUT: (res) => {
    res
      .status(504)
      .json({ error: true, message: 'Tiempo de conexión agotado.' })
  },

  EAI_AGAIN: (res) => {
    res
      .status(504)
      .json({ error: true, message: 'Resolución DNS temporalmente fallida.' })
  },

  ECONNRESET: (res) => {
    res
      .status(502)
      .json({ error: true, message: 'Conexión cerrada inesperadamente.' })
  },

  ERR_BAD_RESPONSE: (res) => {
    res
      .status(502)
      .json({ error: true, message: 'Respuesta inválida del servidor.' })
  },

  // MySQL / DB errors comunes
  ER_ACCESS_DENIED_ERROR: (res) => {
    res
      .status(500)
      .json({ error: true, message: 'Acceso a base de datos denegado: revisa credenciales.' })
  },
  PROTOCOL_CONNECTION_LOST: (res) => {
    res
      .status(502)
      .json({ error: true, message: 'Conexión a base de datos perdida.' })
  },
  PROTOCOL_SEQUENCE_TIMEOUT: (res) => {
    res
      .status(504)
      .json({ error: true, message: 'Timeout comunicándose con la base de datos.' })
  },
  CONFIG_ERROR: (res, err) => {
    res
      .status(500)
      .json({ error: true, message: err?.message || 'Configuración inválida.' })
  },

  /**
   * JWT Errors
   */

  TokenExpiredError: (res) => {
    res.status(401).json({ error: true, message: 'Token expirado.' })
  },

  JsonWebTokenError: (res) => {
    res.status(401).json({ error: true, message: 'Token inválido.' })
  },

  NotBeforeError: (res, err) => {
    res
      .status(401)
      .json({ error: true, message: 'Token no válido aún.', date: err.date })
  },

  /**
   * Basic error
   */

  PayloadTooLargeError: (res) => {
    res.status(413).json({ error: true, message: 'Payload demasiado grande.' })
  },

  Default: (res, error) => {
    console.error('Error desconocido:', error)
    res.status(500).json({ error: true, message: 'Error interno inesperado.' })
  }
}

export default function (error, _req, res, _next) {
  const key = error.code || error.name
  const handler = ERROR_HANDLER[key] ?? ERROR_HANDLER.Default
  handler(res, error)
}
