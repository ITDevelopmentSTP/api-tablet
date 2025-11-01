import Connection from '../util/Connection.js'
import DateTime from '../util/dateTime.js'

// Mapa en memoria para recordar el último paso especial por placa
// Clave: plate | Valor: id_zona del último paso especial pendiente
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
      const special = new Set(['b15', 'b16', 'b17'])

      let handledSpecial = false

      if (plate && special.has(currentZone)) {
        const prev = pendingSpecialByPlate.get(plate)

        if (prev) {
          // Tenemos un par previo+actual, aplicar reglas similares a regSpecialCasesmot
          // Para actualizar la fila correcta, consultamos los últimos 1-2 pasos de la placa
          if ((prev === 'b15' && currentZone === 'b16') ||
              (prev === 'b16' && (currentZone === 'b15' || currentZone === 'b17'))) {
            // Debe marcarse NO cobrar el paso actual (el más reciente)
            const rows = await conn.query(
              'SELECT id FROM pasos WHERE placa = ? AND procesado = 0 ORDER BY fechaHora DESC LIMIT 2',
              [plate]
            )
            if (rows && rows.length >= 1) {
              const currentId = rows[0].id
              await conn.query('UPDATE pasos SET cobrar = 0 WHERE id = ?', [currentId])
              // Marcar ambos (actual y previo si existe) como procesados
              const idsToMark = rows.map(r => r.id)
              const placeholders = idsToMark.map(() => '?').join(',')
              await conn.query(
                `UPDATE pasos SET procesado = 1 WHERE id IN (${placeholders})`,
                idsToMark
              )
            }
            handledSpecial = true
          } else if (prev === 'b17' && currentZone === 'b16') {
            // Debe marcarse NO cobrar el paso anterior (el segundo más reciente)
            const rows = await conn.query(
              'SELECT id FROM pasos WHERE placa = ? AND procesado = 0 ORDER BY fechaHora DESC LIMIT 2',
              [plate]
            )
            if (rows && rows.length === 2) {
              const previousId = rows[1].id
              await conn.query('UPDATE pasos SET cobrar = 0 WHERE id = ?', [previousId])
              // Marcar ambos como procesados
              const idsToMark = [rows[0].id, rows[1].id]
              await conn.query(
                'UPDATE pasos SET procesado = 1 WHERE id IN (?, ?)',
                idsToMark
              )
            }
            handledSpecial = true
          }

          // Limpiar pendiente tras resolver
          pendingSpecialByPlate.delete(plate)
        } else {
          // Es un caso especial inicial: almacenar y esperar a la próxima llamada
          pendingSpecialByPlate.set(plate, currentZone)

          // Devolver sin seguir (diferimos la actualización en tiempo real)
          res.json({ success: true, data: result, deferred: true, reason: 'pending special case' })
          return
        }
      }

      // Ejecutar actualización en tiempo real tras insertar (o tras resolver el par especial)
      // Si no fue un caso especial diferido y no se resolvió par especial,
      // marcar el último paso (recién insertado) como procesado para no re-evaluarlo.
      if (!special.has(currentZone) && plate) {
        const last = await conn.query(
          'SELECT id FROM pasos WHERE placa = ? AND procesado = 0 ORDER BY fechaHora DESC LIMIT 1',
          [plate]
        )
        if (last && last.length === 1) {
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
  }
}
