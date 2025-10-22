import WebhookService from '../webhook/service.js'

export const WebhookController = {
  async handleTest (req, res, next) {
    try {
      const result = await WebhookService.test(req.body)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
}
