import express from 'express'
import cors from 'cors'
import notFound from './middlewares/not-found.js'
import patioRoutes from './api/patio/index.js'
import geotabRoutes from './api/geotab/index.js'
import errorHandler from './middlewares/error-handler.js'
import logger from './middlewares/logger.js'

const app = express()

// config
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// routes
app.get('/', (_, res) => res.json({ message: 'What are you looking for?🤔' }))
app.use('/patio', patioRoutes)
app.use('/geotab', logger, geotabRoutes)

// error handling
app.use(notFound)
app.use(errorHandler)

export default app
