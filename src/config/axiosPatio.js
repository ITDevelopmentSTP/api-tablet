import axios from 'axios'
const { IP_SERVER, IP_PORT } = process.env

const instance = axios.create({
  baseURL: `http://${IP_SERVER}:${IP_PORT}/apipatio/`,
  // timeout: 8000, // si agregas esto, al pasar ese tiempo, tira un error.
  timeoutErrorMessage: 'El servidor de 4D no responde'
})

export default instance
