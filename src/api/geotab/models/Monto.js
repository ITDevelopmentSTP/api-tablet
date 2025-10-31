import Connection from '../util/Connection'

class Monto {
  constructor (plate, startDate = null, endDate = null) {
    this.plate = plate
    this.tolls = this.setPasos(this.plate, startDate, endDate)
    this.ultimaConsultaPasos = null
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
      this.tolls = await conn.query(baseQuery)
      this.ultimaConsultaPasos = new Date()
    } catch (error) {
      console.error('Error al obtener pasos: ', error)
      throw error
    } finally {
      await conn.close()
    }
  }

  getUltimaConsultaPasos () {
    return this.ultimaConsultaPasos
  }

  // Metodos para diferenciar los casos especiales
  // Casos especiales: zonas determinadas en geotab que necesitan un tratamiento distinto
  // debido a la disposicion geografica de las casetas de cobro
  async regSpecialCases () {
    // Asegurar que tenemos los pasos cargados
    if (this.ultimaConsultaPasos == null || this.tolls == null) {
      await this.setPasos()
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
