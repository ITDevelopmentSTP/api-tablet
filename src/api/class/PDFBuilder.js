import PDFDocument from 'pdfkit'

/**
 * Clase PDFBuilder para facilitar la generación y manipulación de documentos PDF.
 *
 * - Permite crear instancias de documentos PDF con configuración personalizada.
 * - Provee un método para generar el PDF y retornarlo como base64, útil para enviar como string o por APIs.
 */
export default class PDFBuilder {
  /**
   * Crea una instancia de PDFDocument.
   * Opciones de configuración para el PDF (tamaño, márgenes, etc.).
   * Instancia de documento PDF configurado.
   */
  static createPDF (options = {}) {
    return new PDFDocument({
      size: 'A4', // Define el tamaño de la hoja como A4.
      margin: 20, // Establece el margen interno del documento.
      ...options // Permite sobreescribir o agregar configuraciones adicionales.
    })
  }

  /**
   * Genera el PDF usando una función de construcción y lo convierte a base64.
   * buildPdf - Función que recibe el documento PDF y agrega el contenido necesario.
   * options - Opciones de configuración para el PDF.
   * Promesa que resuelve al string en base64 del documento PDF generado.
   *
   * Ejemplo de uso:
   * await PDFBuilder.toBase64(doc => { doc.text('Hola mundo') });
   */
  static async toBase64 (buildPdf, options = {}) {
    return new Promise((resolve, reject) => {
      const doc = PDFBuilder.createPDF(options)
      const chunks = []

      // Al recibir chunks de datos, se almacenan en el arreglo 'chunks'.
      doc.on('data', chunk => chunks.push(chunk))

      // Al finalizar el documento, se concatenan los chunks y se convierte a base64.
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer.toString('base64'))
      })

      // En caso de error en la generación, se rechaza la promesa.
      doc.on('error', reject)

      // Función de construcción personalizada que añade el contenido.
      buildPdf(doc)
      doc.end()
    })
  }
}
