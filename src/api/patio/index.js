import { Router } from 'express'
import authRoutes from './auth/routes.js'
import carRoutes from './car/routes.js'
import contractRoutes from './contract/routes.js'
import fredRoutes from './fred/routes.js'
import utilRoutes from './util/routes.js'
import { authorization } from '../../middlewares/authorization.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/car', carRoutes)
router.use('/fred', authorization, fredRoutes)
router.use('/contract', authorization, contractRoutes)
router.use('/util', utilRoutes)

export default router
