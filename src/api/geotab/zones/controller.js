import Connection from '../util/Connection.js'
import DateTime from '../util/dateTime.js'

// Mapa en memoria para recordar el historial de zonas especiales por placa
// Estructura: [zona1, zona2, ...] - historial de zonas especiales consecutivas
const pendingSpecialByPlate = new Map()

export const zonesController = {
  /*
  * Registrar pasos de geotab en bd
  * POST /geotab/zones/toll
  */
  async registerTolls (req, res, next) {
    const conn = new Connection()
    const dt = new DateTime()
    const params = req.body
    const dateTime = dt.toIso(params.date, params.time)
    try {
      const result = await conn.callProcedure('sp_registrarPaso', [params.zoneId, params.deviceName, dateTime])
      const plate = params.deviceName
      const currentZone = params.zoneId
      /*
      * B12 - Ascanio Villalaz (Entrada) - desde Albrook
      * B13 - Ascanio Villalaz (Salida) - hacia Albrook
      * B14 - Martin Sosa
      *
      * Casos especiales:
      * 1. b12 cobra -> b13 no cobra
      * 2. b13 cobra -> b12 no cobra
      * 3. b12 cobra -> b13 no cobra -> b14 no cobra
      * 4. b14 no cobra -> b13 cobra -> b12 no cobra
      * 5. id random cobra -> b14 cobra
      * 6. b14 cobra -> id random cobra
      */
      const special = new Set(['b12', 'b13', 'b14'])

      let handledSpecial = false
      const history = pendingSpecialByPlate.get(plate) || []

      // Helper para marcar pasos como procesados
      const markProcessed = async (ids) => {
        if (ids.length === 0) return
        const placeholders = ids.map(() => '?').join(',')
        await conn.query(`UPDATE pasos SET procesado = 1 WHERE id IN (${placeholders})`, ids)
      }

      // Helper para marcar pasos como no cobrar
      const markNoCobrar = async (ids) => {
        if (ids.length === 0) return
        const placeholders = ids.map(() => '?').join(',')
        await conn.query(`UPDATE pasos SET cobrar = 0 WHERE id IN (${placeholders})`, ids)
      }

      // Helper para obtener los últimos N pasos no procesados
      const getLastUnprocessed = async (limit) => {
        return await conn.query(
          'SELECT id, id_zona FROM pasos WHERE placa = ? AND procesado = 0 ORDER BY fechahora DESC LIMIT ?',
          [plate, limit]
        ) || []
      }

      if (plate && special.has(currentZone)) {
        // Agregar zona actual al historial
        history.push(currentZone)
        const len = history.length

        // Verificar patrones de 3 zonas primero
        if (len >= 3) {
          const [z1, z2, z3] = history.slice(-3)

          // Caso: b12 -> b13 -> b14 (b12 cobra, b13 no cobra, b14 no cobra)
          if (z1 === 'b12' && z2 === 'b13' && z3 === 'b14') {
            const rows = await getLastUnprocessed(3)
            if (rows.length >= 1) {
              // b14 actual no cobra
              await markNoCobrar([rows[0].id])
              // Marcar todos como procesados
              await markProcessed(rows.map(r => r.id))
            }
            pendingSpecialByPlate.delete(plate)
            handledSpecial = true
          }
          // Caso: b14 -> b13 -> b12 (b14 no cobra, b13 cobra, b12 no cobra)
          else if (z1 === 'b14' && z2 === 'b13' && z3 === 'b12') {
            const rows = await getLastUnprocessed(3)
            if (rows.length >= 1) {
              // b12 actual no cobra
              await markNoCobrar([rows[0].id])
              // Marcar todos como procesados
              await markProcessed(rows.map(r => r.id))
            }
            pendingSpecialByPlate.delete(plate)
            handledSpecial = true
          }
        }

        // Verificar patrones de 2 zonas si no se manejó con 3
        if (!handledSpecial && len >= 2) {
          const [z1, z2] = history.slice(-2)

          // Caso: b12 -> b13 (b12 cobra, b13 no cobra) - puede continuar a b14
          if (z1 === 'b12' && z2 === 'b13') {
            const rows = await getLastUnprocessed(2)
            if (rows.length >= 1) {
              // b13 actual no cobra
              await markNoCobrar([rows[0].id])
              // Marcar b12 como procesado, b13 queda pendiente para posible b14
              if (rows.length >= 2) {
                await markProcessed([rows[1].id])
              }
            }
            // Mantener historial para posible continuación a b14
            pendingSpecialByPlate.set(plate, history)
            handledSpecial = true
          }
          // Caso: b13 -> b12 (b13 cobra, b12 no cobra)
          else if (z1 === 'b13' && z2 === 'b12') {
            const rows = await getLastUnprocessed(2)
            if (rows.length >= 1) {
              // b12 actual no cobra
              await markNoCobrar([rows[0].id])
              // Marcar ambos como procesados
              await markProcessed(rows.map(r => r.id))
            }
            pendingSpecialByPlate.delete(plate)
            handledSpecial = true
          }
          // Caso: b14 -> b13 (b14 no cobra, b13 cobra) - puede continuar a b12
          else if (z1 === 'b14' && z2 === 'b13') {
            const rows = await getLastUnprocessed(2)
            if (rows.length >= 2) {
              // b14 (el anterior) no cobra
              await markNoCobrar([rows[1].id])
              // Marcar b14 como procesado, b13 queda pendiente para posible b12
              await markProcessed([rows[1].id])
            }
            // Mantener historial para posible continuación a b12
            pendingSpecialByPlate.set(plate, history)
            handledSpecial = true
          }
        }

        // Si no matcheó ningún patrón especial, guardar historial y no procesar aún
        if (!handledSpecial) {
          pendingSpecialByPlate.set(plate, history)
          // No marcar como procesado, queda pendiente
        }

      } else if (plate && !special.has(currentZone)) {
        // Zona NO especial (id random)

        // Caso: id random -> b14 cobra (ya cobra por defecto, solo limpiar historial anterior)
        // Caso: b14 -> id random (ambos cobran, limpiar historial)
        // Cualquier zona no especial rompe la secuencia

        // Marcar todos los pasos especiales pendientes como procesados (cobran por defecto)
        if (history.length > 0) {
          const rows = await getLastUnprocessed(history.length)
          if (rows.length > 0) {
            await markProcessed(rows.map(r => r.id))
          }
          pendingSpecialByPlate.delete(plate)
        }
        
        // Marcar la zona no especial actual como procesada (siempre cobra)
        const currentRow = await conn.query(
          'SELECT id FROM pasos WHERE placa = ? AND procesado = 0 ORDER BY fechahora DESC LIMIT 1',
          [plate]
        )
        if (currentRow && currentRow.length > 0) {
          await markProcessed([currentRow[0].id])
        }
        handledSpecial = true
      }

      // Ejecutar actualización en tiempo real tras insertar
      // Si es zona no especial y no fue manejada, marcar como procesado
      if (!special.has(currentZone) && plate && !handledSpecial) {
        const last = await conn.query(
          'SELECT id FROM pasos WHERE placa = ? AND procesado = 0 ORDER BY fechahora DESC LIMIT 1',
          [plate]
        )
        if (last && last.length > 0) {
          await conn.query('UPDATE pasos SET procesado = 1 WHERE id = ?', [last[0].id])
        }
      }

      // const monto = new Monto(plate)
      // await monto.realTimeUpdate()
      res.json({ success: true, data: result, handledSpecial })
    } catch (error) {
      next(error)
    } finally {
      await conn.close()
    }
  },
  async testConnection (req, res, next) {
    const conn = new Connection()
    const {
      DB_HOST,
      DB_USER,
      DB_PASSWORD,
      DB_DATABASE,
      DB_PORT
    } = process.env
    try {
      const result = await conn.query('SELECT * FROM zonas LIMIT 1')
      res.status(200).json({
        message: 'Test OK: connection successful',
        result,
        env: {
          DB_HOST,
          DB_USER,
          DB_DATABASE,
          DB_PORT,
          DB_PASSWORD: DB_PASSWORD ? '***' : undefined
        },
        requestBody: req.body
      })
    } catch (error) {
      // Deja que el middleware de errores formatee la respuesta
      next(error)
    } finally {
      await conn.close()
    }
  }
}
