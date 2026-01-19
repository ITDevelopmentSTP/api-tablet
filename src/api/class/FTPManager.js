import { Readable, PassThrough } from 'stream' // Clase readable para convertir buffer en flujos
import ftp from 'basic-ftp'
import path from 'path'

class FTPManager {
  constructor (ftpConfig) {
    this.ftpConfig = ftpConfig // Almacenar la configuración del servidor FTP
  }

  async postFTP (base64, dir, filename, options = {}) {
    const client = new ftp.Client()

    try {
      // Convierte el base64 en datos binarios y detecta el tipo de MIME
      const { buffer, mimeType, extension } = this.processBase64(base64)
      // Establecer el canal FTP
      await this.connect(client)

      // Determinar directorio remoto y nombre de archivo remoto.
      // Si `filename` no fue provisto, mantenemos compatibilidad y extraemos
      // el nombre desde `dir` asumiendo que `dir` podría contener el nombre.
      let remoteDir = dir
      let remoteFilename = filename
      if (!remoteFilename) {
        remoteFilename = path.basename(dir)
        remoteDir = path.dirname(dir)
      }

      // Normalizar a slash (basic-ftp espera rutas con '/').
      const normalizedDir = (remoteDir || '').replace(/\\/g, '/')

      // Sanitizar el nombre de archivo remoto (evitar : \ / y otros caracteres problemáticos)
      let normalizedFilename = remoteFilename || ''
      normalizedFilename = normalizedFilename.replace(/[\\/:*?"<>|\r\n]+/g, '_')

      // Determinar la extensión objetivo: prioridad -> options.forceExtension -> extensión detectada
      let targetExt = null
      if (options && options.forceExtension && options.forceExtension !== '') {
        targetExt = String(options.forceExtension).replace(/^\./, '').toLowerCase()
      } else if (extension) {
        targetExt = String(extension).replace(/^\./, '').toLowerCase()
      }

      if (targetExt && !normalizedFilename.toLowerCase().endsWith('.' + targetExt)) {
        normalizedFilename = `${normalizedFilename}.${targetExt}`
      }

      // Si hay directorio remoto, moverse o crearlo según opciones.
      if (normalizedDir && normalizedDir !== '' && normalizedDir !== '.') {
        const dirToUse = normalizedDir.replace(/^\/+/, '')
        if (options.createDirectories) {
          await this.ensureDirectoryExists(client, dirToUse)
        } else {
          try {
            await client.cd(dirToUse)
          } catch (err) {
            throw new Error(`Remote directory not accessible: ${dirToUse}`)
          }
        }
      }

      // Basic-ftp no soporta subir buffers directamente, convertir a stream
      const stream = Readable.from(buffer)

      // Subir usando sólo el nombre de archivo (STOR <filename>) — evita pasar rutas completas
      await client.uploadFrom(stream, normalizedFilename)
      // Retornar metadatos utiles
      client.close()
      return {
        success: true,
        filename: normalizedFilename,
        size: buffer.length,
        mime: mimeType,
        ext: extension
      }
    } catch (error) {
      console.error('FTP upload error:', error)
      client.close()
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getFTP (dir, filename, fileExtension) {
    const client = new ftp.Client()

    try {
      await this.connect(client)

      // Determinar ruta remota y nombre de archivo remoto (compatibilidad)
      let remoteDir = dir
      let remoteFilename = filename
      if (!remoteFilename) {
        remoteFilename = path.basename(dir)
        remoteDir = path.dirname(dir)
      }

      const normalizedDir = (remoteDir || '').replace(/\\/g, '/')

      // Si se proporciona fileExtension, asegurar que el nombre remoto la incluya
      let normalizedFilename = remoteFilename
      if (fileExtension) {
        const ext = fileExtension.replace(/^\./, '').toLowerCase()
        if (!normalizedFilename.toLowerCase().endsWith('.' + ext)) {
          normalizedFilename = `${normalizedFilename}.${ext}`
        }
      }

      const remotePath = normalizedDir ? path.posix.join(normalizedDir, normalizedFilename) : normalizedFilename

      // Descargar a un stream en memoria
      const chunks = []
      const pass = new PassThrough()
      pass.on('data', (chunk) => chunks.push(chunk))

      await client.downloadTo(pass, remotePath)

      const fileBuffer = Buffer.concat(chunks)

      // Detectar MIME. Si se pasó fileExtension, preferimos su tipo MIME.
      const tmpBase64 = `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`

      let mimeType = null
      if (fileExtension) {
        const ext = fileExtension.replace(/^\./, '').toLowerCase()
        const mimeMap = {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          gif: 'image/gif',
          webp: 'image/webp',
          svg: 'image/svg+xml',
          pdf: 'application/pdf',
          mp4: 'video/mp4',
          zip: 'application/zip',
          txt: 'text/plain'
        }
        mimeType = mimeMap[ext] || null
      }

      if (!mimeType) {
        const detected = this.processBase64(tmpBase64)
        mimeType = detected.mimeType
      }

      const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`

      client.close()
      return dataUrl
    } catch (error) {
      console.error('FTP download error:', error)
      client.close()
      return undefined
    }
  }

  processBase64 (base64) {
    if (!base64 || typeof base64 !== 'string') throw new Error('base64 string required')

    // Eliminar espacios y saltos de línea
    const cleaned = base64.trim()

    // Detectar y extraer header data:[mime];base64, si existe
    const dataUrlMatch = cleaned.match(/^data:([^;]+);base64,(.*)$/i)
    let mimeFromHeader = null
    let base64Body = cleaned
    if (dataUrlMatch) {
      mimeFromHeader = dataUrlMatch[1].toLowerCase()
      base64Body = dataUrlMatch[2]
    }

    // Quitar posibles espacios dentro del base64
    base64Body = base64Body.replace(/\s+/g, '')

    // Convertir el base64 a buffer
    const buffer = Buffer.from(base64Body, 'base64')

    // Detección por firma (magic numbers)
    const signature = (buf, start, len) => buf.slice(start, start + len)
    let mimeType = mimeFromHeader || 'application/octet-stream'

    try {
      const head = buffer.slice(0, 200).toString('utf8').toLowerCase()
      switch (true) {
        case (buffer.length >= 8 && signature(buffer, 0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))):
          mimeType = 'image/png'
          break
        case (buffer.length >= 3 && signature(buffer, 0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))):
          mimeType = 'image/jpeg'
          break
        case (buffer.length >= 6 && (signature(buffer, 0, 6).toString() === 'GIF87a' || signature(buffer, 0, 6).toString() === 'GIF89a')):
          mimeType = 'image/gif'
          break
        case (buffer.length >= 4 && signature(buffer, 0, 4).toString() === '%PDF'):
          mimeType = 'application/pdf'
          break
        case (buffer.length >= 12 && signature(buffer, 0, 4).toString() === 'RIFF' && signature(buffer, 8, 4).toString() === 'WEBP'):
          mimeType = 'image/webp'
          break
        case (buffer.length >= 12 && signature(buffer, 4, 4).toString() === 'ftyp'):
          mimeType = 'video/mp4'
          break
        case (buffer.length >= 4 && signature(buffer, 0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))):
          mimeType = 'application/zip'
          break
        case (head.indexOf('<svg') !== -1):
          mimeType = 'image/svg+xml'
          break
        // eslint-disable-next-line no-control-regex
        case (head.length > 0 && /^[\x09\x0A\x0D\x20-\x7E]+$/.test(head)):
          mimeType = mimeFromHeader || 'text/plain'
          break
        default:
      }
    } catch (e) {
      // En caso de error en la detección, conservar fallback
      console.warn('Error detecting MIME type by signature:', e)
    }

    const extMap = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'video/mp4': 'mp4',
      'application/zip': 'zip',
      'text/plain': 'txt'
    }

    const extension = extMap[mimeType] || (mimeFromHeader ? mimeFromHeader.split('/').pop() : 'bin')

    return { buffer, mimeType, extension }
  }

  async connect (client) {
    await client.access({
      host: this.ftpConfig.host,
      user: this.ftpConfig.user,
      password: this.ftpConfig.password,
      port: this.ftpConfig.port || 21,
      secure: this.ftpConfig.secure || false,
      secureOptions: this.ftpConfig.secureOptions || {}
    })
  }

  async ensureDirectoryExists (client, dir) {
    try {
      await client.ensureDir(dir)
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error)
      throw error
    }
  }
}

export default FTPManager
