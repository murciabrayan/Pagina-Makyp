export interface AyudaItem {
  id: string
  question: string
  /** Párrafos de la respuesta. */
  answer: string[]
  /** Puntos sueltos, cuando la respuesta es una lista. */
  list?: string[]
  /** Nota al pie de la respuesta. */
  note?: string
}

/**
 * Respuestas a las preguntas del pie de página. El contenido sale de cómo
 * trabaja Makyp de verdad; lo que se acuerda caso por caso se dice así, en
 * vez de inventar una política fija.
 */
export const ayudaItems: AyudaItem[] = [
  {
    id: 'como-comprar',
    question: '¿Cómo comprar?',
    answer: ['Comprar es sencillo y siempre terminamos de acordar todo por WhatsApp:'],
    list: [
      'Elige lo que te guste en la tienda, o arma tu propio ramo en “Crear mi ramo”.',
      'Agrégalo al carrito, o escríbenos directo con el botón de WhatsApp del producto.',
      'Te confirmamos el precio final y en cuánto tiempo lo tenemos listo.',
      'Acordamos el pago y la entrega, y manos a la obra.',
    ],
    note: 'No necesitas crear una cuenta ni pagar en la página.',
  },
  {
    id: 'pagos',
    question: 'Métodos de pago',
    answer: ['Puedes pagar de dos formas:'],
    list: ['Transferencia bancaria.', 'Efectivo al momento de la entrega.'],
    note: 'Los datos para la transferencia te los pasamos por WhatsApp al confirmar tu pedido.',
  },
  {
    id: 'envios',
    question: 'Envíos y entregas',
    answer: ['Tenemos tres formas de hacerte llegar tu detalle:'],
    list: [
      'Domicilio dentro de la ciudad.',
      'Envío a todo Colombia por transportadora.',
      'Recoger en un punto que acordemos.',
    ],
    note: 'El costo del envío y la fecha de entrega los confirmamos por WhatsApp, porque dependen de a dónde va y de qué pediste.',
  },
  {
    id: 'cambios',
    question: 'Cambios y devoluciones',
    answer: [
      'Cada detalle se hace a mano y por encargo, así que no manejamos una política automática de devoluciones.',
      'Si algo no llegó como esperabas, escríbenos por WhatsApp y lo revisamos contigo caso por caso. Nos importa que quedes contenta con tu detalle.',
    ],
  },
  {
    id: 'cuidados',
    question: '¿Cómo cuido mi ramo?',
    answer: [
      'Al estar hechos con limpiapipas, tus flores no se marchitan: duran años si las cuidas bien.',
      'No necesitan agua. Mantenlas lejos de la humedad y del sol directo, y si les cae polvo, sacúdelas suavemente o pásales un secador en aire frío.',
    ],
  },
]
