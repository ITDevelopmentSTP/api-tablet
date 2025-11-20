import axios from '../../config/axiosPatio.js'

class Geotab {
  constructor (plate) {
    const { GEOTAB_USER, GEOTAB_PASSWORD, GEOTAB_DATABASE } = process.env
    this.credentials = {
      database: GEOTAB_DATABASE,
      userName: GEOTAB_USER,
      password: GEOTAB_PASSWORD
    }
    this.plate = plate
    this.payload = {}
  }

  // Getters y setters
  setCredentials (user, password, database) {
    this.credentials = {
      database,
      userName: user,
      password
    }
  }

  getCredentials () {
    return this.credentials
  }

  setPlate (plate) {
    this.plate = plate
  }

  getPlate () {
    return this.plate
  }

  getPayload () {
    return this.payload
  }

  setPayload (payload) {
    this.payload = payload
  }

  // Metodos
  // Armar payload automatico para solicitud a Geotab
  buildPayload (m) {
    return {
      method: m,
      credentials: this.credentials,
      plate: this.plate
    }
  }

  // Vaciar payload para nueva solicitud
  clearPayload () {
    this.payload = {}
  }

  // Solicitudes a Geotab
  // Odometro
  async fetchOdometer () {
    this.clearPayload() // Limpiar payload previo
    this.payload = this.buildPayload('GetOdometer')
    const data = await axios.post('geotab', this.payload)
    const response = { // Estructura de respuesta
      km: null,
      time: null,
      geotab: false
    }
    if (data.data.code === 200) {
      response.km = data.data.km
      response.time = data.data.time
      response.geotab = true
    }
    return response
  }

  // Combustible
  async fetchFuel () {
    this.clearPayload() // Limpiar payload previo
    this.payload = this.buildPayload('GetFuelStatus')
    const data = await axios.post('geotab', this.payload)
    const response = { // Estructura de respuesta
      gas: null,
      time: null,
      geotab: false
    }
    if (data.data.code === 200) {
      response.gas = data.data.fraction
      response.time = data.data.time
      response.geotab = true
    }
    return response
  }
}

export default Geotab
