import Connection from '../util/Connection.js'
import DateTime from '../util/dateTime.js'
import Monto from '../models/Monto.js'

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
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    } finally {
      await conn.close()
    }
  },
  /*
  * Registrar monto por placa
  * POST /geotab/zones/montos
  * Body: { plate: string, startDate: ISODate, endDate: ISODate }
  */
  async processData (req, res, next) {
    const monto = new Monto(req.body.plate, req.body.startDate, req.body.endDate)
    try {
      await monto.regSpecialCases()
      const total = await monto.calcAmount()
      res.json({ success: true, data: { monto, total } })
    } catch (error) {
      next(error)
    }
  }
}
