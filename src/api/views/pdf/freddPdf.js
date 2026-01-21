import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Genera el contenido de un documento PDF con información de contrato y condiciones de alquiler/devolución de vehículo.
 *
 * doc - Instancia de documento PDF donde se renderizarán los datos.
 * data - Información del contrato, vehículo y cliente.
 *
 * Utiliza la marca seleccionada en `data.brand` para mostrar el logotipo y color característico.
 * Renderiza encabezado, datos principales del contrato, sección de inspección si corresponde, imagen relacionada y firma.
 */
export default async function freddPdf (doc, data) {
  // Diccionario de marcas y sus atributos de imagen y color
  const brandDictionary = {
    1: { image: 'national.jpg', color: '#1b5e20' },
    2: { image: 'alamo.jpg', color: '#0d47a1' },
    3: { image: 'enterprise.jpg', color: '#169a5a' }
  }

  // Extrae valores de marca, imagen y color (usa valores por defecto si la marca no existe)
  const { brand } = data
  const { image, color } = brandDictionary[brand] || { image: 'national.jpg', color: '#1b5e20' }

  // Resuelve rutas absolutas de los archivos de imagen
  const __fileName = fileURLToPath(import.meta.url)
  const __dirName = path.dirname(__fileName)
  const imagePath = path.join(__dirName, `../assets/${image}`)

  // Inserta el logotipo de la marca en el encabezado del documento
  doc.image(imagePath, 0, 0, {
    fit: [doc.page.width, 90],
    align: 'center',
    valign: 'top'
  })

  /* ====================================================
  * ENCABEZADO DEL DOCUMENTO
  * ===================================================== */
  doc.fillColor('black').font('Helvetica-Bold').fontSize(13).text(data.tituloDocumento, 20, 110)

  // Sección de contrato
  doc.fillColor(color).fontSize(13).text('Contrato N°', 440, 110)
  doc.fillColor('black').fontSize(12).font('Helvetica-Bold').text(data.contrato, 440, 130)

  /* ===================================================
  * DATOS PRINCIPALES DEL CLIENTE Y VEHÍCULO
  * ===================================================== */
  let y = 130
  const labelX = 20
  const valueX = 170

  // Función para mostrar filas de datos con título y valor
  function row (label, value) {
    doc.fillColor('black').font('Helvetica').fontSize(10).text(label, labelX, y)
    doc.fillColor('black').font('Helvetica').text(value, valueX, y)
    y += 18
  }

  // Renderiza los datos principales
  row('Nombre del Arrendatario:', data.nombreConductor)
  row('Vehículo:', data.descripcionVehiculo)
  row('Placa:', data.placa)
  row('Combustible:', data.gas)
  row('Kilometraje:', data.kilometraje)
  row(data.fechaDocumento, data.fechaSalida)

  // Si el tipo es devolución, inserta icono de "check" y texto de aceptación de inspección
  if (data.tipoFredd === 'Devolución') {
    const iconCheck = path.join(__dirName, '../assets/check.png')
    doc.image(iconCheck, 20, y + 2, { width: 24, height: 24 })
    doc
      .fillColor('black')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Acepto la inspección de devolución y certifico no haber dejado artículos de mi propiedad en el auto.', 50, y + 8)
  }

  // Si existe imagen del estado Fredd, la inserta
  if (data.imageFredd) {
    doc.image(base64ToBuffer(data.imageFredd), 30, y + 30, { width: 425 })
  }

  y = 530

  // Marca menor
  doc.rect(20, y, 20, 15).fill('red')
  doc.fillColor('black').fontSize(9).text('Marca menor', 45, y + 4)

  // Leve imperfección
  doc.rect(140, y, 20, 15).fill('blue')
  doc.fillColor('black').text('Leve imperfección', 165, y + 4)

  /* ===================================================
  * MENSAJE FINAL DE AGRADECIMIENTO
  * ===================================================== */
  doc.fillColor('black').fontSize(10)
    .text('Agradecemos su elección y esperamos seguir siendo su socio de confianza en todas sus necesidades.', 20, y + 30)

  /* ===================================================
  * FIRMA DEL CLIENTE
  * ===================================================== */
  doc.fillColor('black').font('Helvetica').fontSize(10).text('Firma del Cliente:', 20, y + 60)

  // Si existe firma digital, la inserta
  if (data.digitalSignature) {
    doc.image(base64ToBuffer(data.digitalSignature), 20, y + 50, { width: 275 })
  }
}

/**
 * Convierte una cadena base64 a un Buffer, limpiando el encabezado si existe.
 * base64 - Cadena base64 de la imagen
 * Buffer binario de la imagen
 */
function base64ToBuffer (base64) {
  const cleaned = base64.includes('base64,')
    ? base64.split('base64,')[1]
    : base64

  return Buffer.from(cleaned, 'base64')
}
