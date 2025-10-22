import WebhookService from '../webhook/service.js'

export const WebhookController = {
  async handleTest (req, res, next) {
    try {
      const result = await WebhookService.test(req.body)
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  // Responder GET /test con mensaje de confirmación
  async handleGetTest (_req, res) {
    res.status(200).json({ message: 'Test OK: petición GET recibida correctamente' })
  }
}
