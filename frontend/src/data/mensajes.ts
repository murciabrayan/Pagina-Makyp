/**
 * Los textos con los que arranca cada conversación de WhatsApp.
 *
 * Se quedan en el código y no en el panel a propósito: no son un texto suelto,
 * son plantillas con huecos que se rellenan (el nombre del producto, el total
 * del carrito, el detalle del ramo). Si se editaran desde el panel, borrar un
 * hueco sin querer mandaría pedidos incompletos a WhatsApp, y eso no se nota
 * hasta que llega el mensaje.
 */
export const whatsappMessages = {
  general: 'Hola Makyp Creations 💜 Quiero más información sobre sus detalles.',
  product: (name: string, price: string) =>
    `Hola 💜 Me interesa el/la ${name} (${price}). ¿Está disponible?`,
  cart: (lines: string[], total: string) =>
    `Hola Makyp Creations 💜 Quiero pedir:\n${lines.join('\n')}\n\nTotal: ${total}`,
  categoria: (categoria: string) =>
    `Hola Makyp Creations 💜 Quiero algo de ${categoria.toLowerCase()}. ¿Qué opciones tienen o lo pueden hacer por encargo?`,
  customizer: (details: string[]) =>
    `Hola Makyp Creations 💜 Quiero pedir un ramo personalizado:\n${details.join('\n')}\n\n¿Cuánto tardaría y cuánto costaría?`,
}
