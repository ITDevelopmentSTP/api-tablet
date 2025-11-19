import axios from '../../../config/axiosPatio.js'

class Geotab {
  constructor (plate) {
    const { GEOTAB_USER, GEOTAB_PASSWORD, GEOTAB_DATABASE } = process.env
    this.credentials = {
      database: GEOTAB_DATABASE,
      userName: GEOTAB_USER,
      password: GEOTAB_PASSWORD
    }
    this.plate = plate
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

  // Metodos
  // Armar payload para solicitud a Geotab
  buildPayload (m) {
    return {
      method: m,
      credentials: this.credentials,
      plate: this.plate
    }
  }

  // Solicitudes a Geotab
  async fetchGeotabData (method) {
    const payload = this.buildPayload(method)
    let response = await axios.post('geotab', payload)
    if (response.data.code !== 200) response = false
    return response
  }
}

export default Geotab
