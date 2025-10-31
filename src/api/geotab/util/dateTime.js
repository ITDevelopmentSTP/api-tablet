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
  toIso (date = this.date, time = this.time) { // Convierte fecha y hora a formato ISO 8601
    const isPM = time.toUpperCase().includes('PM')
    let format24h = 0
    if (isPM) {
      format24h = 12
    }
    time = time.replace(/\s*(AM|PM)\s*/i, '') // Elimina AM/PM si existe
    let [hours, minutes, seconds] = time.split(':').map(Number)
    hours += format24h
    this.dateTime = new Date(`${date} ${hours}:${minutes}:${seconds}`)
    return this.dateTime
  }
}

export default DateTime
