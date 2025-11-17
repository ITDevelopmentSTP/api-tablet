class DateTime {
  constructor () {
    this.date = null
    this.time = null
    this.dateTime = null
  }

  // Getters y setters
  getDate () {
    return this.date
  }

  setDate (date) {
    this.date = date
  }

  getTime () {
    return this.time
  }

  setTime (time) {
    this.time = time
  }

  getDateTime () {
    return this.dateTime
  }

  setDateTime (dateTime) {
    this.dateTime = dateTime
  }

  // Metodos de conversion entre formatos
  toIso (date = this.date, time = this.time) { // Convierte fecha y hora a Date (compatible Win/Linux)
    if (!date || !time) {
      throw Object.assign(new Error('Fecha u hora no provista'), { code: 'BAD_DATETIME_INPUT' })
    }

    // Normalizar entradas
    const dateStr = String(date).trim()
    const timeStr = String(time).trim()

    // Mapas de meses (en/ES), soporta abreviaturas y nombres completos
    const months = {
      jan: 0,
      january: 0,
      ene: 0,
      enero: 0,
      feb: 1,
      february: 1,
      febrero: 1,
      mar: 2,
      march: 2,
      marzo: 2,
      apr: 3,
      april: 3,
      abr: 3,
      abril: 3,
      may: 4,
      mayo: 4,
      jun: 5,
      june: 5,
      junio: 5,
      jul: 6,
      july: 6,
      julio: 6,
      aug: 7,
      august: 7,
      ago: 7,
      agosto: 7,
      sep: 8,
      sept: 8,
      september: 8,
      septiembre: 8,
      oct: 9,
      october: 9,
      octubre: 9,
      nov: 10,
      november: 10,
      noviembre: 10,
      dec: 11,
      december: 11,
      dic: 11,
      diciembre: 11
    }

    // 1) Parse de fecha
    let y, m, d

    // Caso A: ISO simple YYYY-MM-DD
    const mIso = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (mIso) {
      y = parseInt(mIso[1])
      m = parseInt(mIso[2]) - 1
      d = parseInt(mIso[3])
    } else {
      // Caso B: "Mon, D, YYYY" | "Mon D, YYYY" | "Mon D YYYY" (ingles/español)
      // Permitimos puntos y comas después del mes
      const cleaned = dateStr.replace(/\./g, '')
      const mWord = cleaned.match(/^([A-Za-zñÑ]+)[,\s]+(\d{1,2})[,\s]+(\d{4})$/)
      if (mWord) {
        const monthKey = mWord[1].toLowerCase()
        if (!(monthKey in months)) {
          throw Object.assign(new Error(`Mes no reconocido: ${mWord[1]}`), { code: 'BAD_DATETIME_INPUT' })
        }
        m = months[monthKey]
        d = parseInt(mWord[2])
        y = parseInt(mWord[3])
      } else {
        throw Object.assign(new Error(`Formato de fecha no soportado: ${dateStr}`), { code: 'BAD_DATETIME_INPUT' })
      }
    }

    // 2) Parse de hora
    // Acepta: "h:mm[:ss] AM/PM" o "HH:mm[:ss]" (24h)
    const tMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/)
    if (!tMatch) {
      throw Object.assign(new Error(`Formato de hora no soportado: ${timeStr}`), { code: 'BAD_DATETIME_INPUT' })
    }
    let hh = parseInt(tMatch[1])
    const mm = parseInt(tMatch[2])
    const ss = tMatch[3] ? parseInt(tMatch[3]) : 0
    const ampm = tMatch[4] ? tMatch[4].toUpperCase() : null

    if (ampm) {
      // Corrección estándar: 12 AM -> 0, 12 PM -> 12, resto PM +12
      if (ampm === 'AM') {
        if (hh === 12) hh = 0
      } else {
        if (hh !== 12) hh += 12
      }
    }

    // 3) Construir Date de forma explícita (local time) para evitar parsing por string
    const result = new Date(y, m, d, hh, mm, ss)

    if (Number.isNaN(result.getTime())) {
      throw Object.assign(new Error('Fecha/hora inválida tras el parseo'), { code: 'BAD_DATETIME_INPUT' })
    }

    this.dateTime = result
    // Ajustar a zona horaria de Panama (UTC-5)
    this.dateTime = new Date(this.dateTime.getTime() - 5 * 60 * 60 * 1000)
    return this.dateTime
  }
}

export default DateTime
