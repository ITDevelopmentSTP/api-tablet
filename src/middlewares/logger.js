import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers,
    body: req.body
  }

  // Logger consola
  console.log('----------------------------------------')
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`)
  console.log('Headers:')
  console.log(JSON.stringify(req.headers, null, 2))
  console.log('Body:')
  try {
    console.log(JSON.stringify(req.body, null, 2))
  } catch (e) {
    // If body contains circular references or non-serializable data
    console.log(String(req.body))
  }
  console.log('----------------------------------------')

  // Logger archivo
  writeLogToFile(logEntry)

  next()
}

// Funcion pra escribir logs en archivo
const writeLogToFile = (logEntry) => {
  try {
    const logsDir = path.join(__dirname, '../logs')

    // si no existe el directorio, crearlo
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
    const logFileName = `logs-${new Date().toISOString().split('T')[0]}.txt`
    const logFilePath = path.join(logsDir, logFileName)

    // Formato
    const logLine = [
      '=== LOG ENTRY ===',
      `Timestamp: ${logEntry.timestamp}`,
      `Method: ${logEntry.method}`,
      `URL: ${logEntry.url}`,
      `IP: ${logEntry.ip}`,
      'Headers:',
      JSON.stringify(logEntry.headers, null, 2),
      'Body:',
      JSON.stringify(logEntry.body, null, 2),
      '================='
    ].join('\n') + '\n\n'
    fs.appendFileSync(logFilePath, logLine, 'utf8')
  } catch (error) {
    console.error('Error escribiendo en archivo de log: ', error)
  }
}

// Limpiar los logs antiguos
const cleanupOldLogs = (daysToKeep = 7) => {
  try {
    const logsDir = path.join(__dirname, '../logs')
    if (!fs.existsSync(logsDir)) return

    const files = fs.readdirSync(logsDir)
    const now = Date.now()
    const millisecondsPerDay = 24 * 60 * 60 * 1000

    files.forEach(file => {
      if (file.startsWith('logs-') && file.endsWith('.txt')) {
        const filePath = path.join(logsDir, file)
        const stats = fs.statSync(filePath)
        const fileAge = now - stats.mtime.getTime()

        if (fileAge > daysToKeep * millisecondsPerDay) {
          fs.unlinkSync(filePath)
          console.log(`🗑️ Log eliminado: ${file}`)
        }
      }
    })
  } catch (error) {
    console.error('Error limpiando logs antiguos:', error)
  }
}
// exportar también la función de limpieza por si se quiere invocar desde otro módulo
export default logger
export { cleanupOldLogs }
