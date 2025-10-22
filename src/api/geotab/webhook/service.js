class WebhookService {
  // Procesar un payload de prueba y devolver un resultado simple
  static async test (payload) {
    return {
      message: 'WebHook test recibido',
      payload,
      receivedAt: new Date().toISOString()
    }
  }
}

export default WebhookService
