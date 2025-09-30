import express from 'express'
import cors from 'cors'
import notFound from './middlewares/not-found.js'
import patioRoutes from './api/patio/index.js'
import errorHandler from './middlewares/error-handler.js'

const app = express()

// config
app.use(express.json({ limit: '20mb' }))
app.use(cors())

// routes
app.get('/', (_, res) => res.json({ message: 'What are you looking for?🤔' }))
app.use('/patio', patioRoutes)

// error handling
app.use(notFound)
app.use(errorHandler)

export default app
