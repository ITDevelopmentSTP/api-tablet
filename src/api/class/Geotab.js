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
  buildPayload () {
    return {
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
  async fetchCarData () {
    this.clearPayload() // Limpiar payload previo
    this.setPayload(this.buildPayload()) // Armar nuevo payload
    const data = await axios.post('geotab', this.payload)
    // Estructura de respuesta unificada
    const response = {
      odometer: {
        km: null,
        time: null,
        geotab: false
      },
      fuel: {
        gas: null,
        time: null,
        geotab: false
      },
      overall: {
        geotab: false,
        code: null,
        timestamp: null
      }
    }

    // Asignar datos generales
    if (data.data.code === 200) {
      response.overall.geotab = true
      response.overall.code = data.data.code
      response.overall.timestamp = data.data.timestamp
      response.overall.plate = data.data.plate

      // Asignar datos de odómetro
      if (data.data.odometer && data.data.odometer.code === 200) {
        response.odometer.km = data.data.odometer.km
        response.odometer.time = data.data.odometer.lastUpdate
        response.odometer.geotab = true
        response.odometer.deviceId = data.data.odometer.deviceId
      }

      // Asignar datos de combustible
      if (data.data.fuel && data.data.fuel.code === 200) {
        response.fuel.gas = data.data.fuel.fraction
        response.fuel.time = data.data.fuel.lastUpdate
        response.fuel.geotab = true
        response.fuel.liters = data.data.fuel.liters
        response.fuel.tankCapacity = data.data.fuel.tankCapacity
        response.fuel.eights = data.data.fuel.eights
      }
    } else if (data.data.code === 500 && data.data.error) {
      response.overall.error = data.data.error
    }

    return response
  }
}

export default Geotab
