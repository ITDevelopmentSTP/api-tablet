import axios from 'axios'
const { IP_SERVER, IP_PORT } = process.env

const instance = axios.create({
  baseURL: `http://${IP_SERVER}:${IP_PORT}/apitaller/`
})

export default instance
