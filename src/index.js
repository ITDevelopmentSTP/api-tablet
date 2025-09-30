import './config/env.js'
import app from './app.js'
const PORT = process.env.PORT ?? 3000

console.log(`IP server: ${process.env.IP_SERVER}:${process.env.IP_PORT} ✨`)

app.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT} 🚀`)
)
