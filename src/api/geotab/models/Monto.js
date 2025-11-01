import Connection from '../util/Connection.js'

class Monto {
  constructor (plate, startDate = null, endDate = null) {
    this.plate = plate
    this.tolls = this.setPasos(this.plate, startDate, endDate)
    this.lastTollDate = null
  }

  // Getters y setters
  getPlate () {
    return this.plate
  }

  setPlate (plate) {
    this.plate = plate
  }

  getPasos () {
    return this.tolls
  }

  async setPasos () {
    // Consultar todos los pasos por placa, en rango de fechas o total
    if (!this.plate) {
      throw new Error('La placa es requerida para consultar los pasos.')
    }
    const conn = new Connection()
    let baseQuery = `SELECT * FROM pasos WHERE placa = "${this.plate}"`

    if (this.startDate && this.endDate) {
      baseQuery += ` AND fechaHora BETWEEN '${this.startDate}' AND '${this.endDate}'`
    } else if (this.startDate) {
      baseQuery += ` AND fechaHora >= '${this.startDate}'`
    } else if (this.endDate) {
      baseQuery += ` AND fechaHora <= '${this.endDate}'`
    }
    baseQuery += ' AND procesado = false ORDER BY fechaHora DESC'
    try {
      const tolls = await conn.query(baseQuery)
      this.tolls = tolls
      this.lastTollDate = new Date()
      return tolls
    } catch (error) {
      console.error('Error al obtener pasos: ', error)
      throw error
    } finally {
      await conn.close()
    }
  }

  getUltimaConsultaPasos () {
    return this.lastTollDate
  }

  // Metodos para diferenciar los casos especiales
  // Casos especiales: zonas determinadas en geotab que necesitan un tratamiento distinto
  // debido a la disposicion geografica de las casetas de cobro
  async regSpecialCases () {
    // Asegurar que tenemos los pasos cargados
    if (this.lastTollDate == null || this.tolls == null) {
      await this.setPasos(this.plate)
    }

    for (let i = 0; i < this.tolls.length; i++) {
      const current = this.tolls[i]
      const next = this.tolls[i + 1]
      switch (current.id_zona) {
        case 'b15': // Ascanio Villalaz entrada
          if (next && next.id_zona === 'b16') {
            next.cobrar = false
          }
          break
        case 'b16': // Ascanio Villalaz salida
          if (next && next.id_zona === 'b15') {
            next.cobrar = false
          }
          if (next && next.id_zona === 'b17') {
            next.cobrar = false
          }
          break
        case 'b17': // Martin Soza
          if (next && next.id_zona === 'b16') {
            current.cobrar = false
          }
          break
        default:
          break
      }
      current.procesado = true
    }
    try {
      await this.updateToCharge()
    } catch (error) {
      console.error('Error al actualizar los pasos:', error)
    }
  }

  // async realTimeUpdate () {
  //   try {
  //     await this.setPasos(this.plate, this.lastTollDate)
  //   } catch (error) {
  //     console.error('Error al obtener los pasos:', error)
  //     return error
  //   }
  //   for(let i = 0; i < this.tolls.length; i++) {
  //     const current = this.tolls[i]
  //     const next = this.tolls[i + 1]
  //     if (current.id_zona === 'b15' && next && next.id_zona === 'b16') {
  //     }
  //   }
  // }

  async updateToCharge () {
    // persistir los cambios en la BD (actualizar cobrar y procesado)
    const conn = new Connection()
    try {
      // Usar transacción para asegurar consistencia
      const updated = await conn.transaction(async (c) => {
        let affected = 0
        for (const toll of this.tolls) {
          // Asegurarse de que exista un id para actualizar
          if (!toll.id) continue
          const cobrarVal = toll.cobrar ? 1 : 0
          const procesadoVal = toll.procesado ? 1 : 0
          await c.query('UPDATE pasos SET cobrar = ?, procesado = ? WHERE id = ?', [cobrarVal, procesadoVal, toll.id])
          affected += 1
        }
        return affected
      })
      this.tolls = null // Limpiar pasos para forzar recarga en proxima consulta
      return updated
    } catch (error) {
      console.error('Error actualizando casos especiales en pasos:', error)
      throw error
    } finally {
      await conn.close()
    }
  }
}

export default Monto
