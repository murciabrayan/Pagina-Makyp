export const site = {
  whatsapp: {
    phone: '573203684500',
    displayPhone: '+57 320 368 4500',
  },
  email: 'makyp.creations@gmail.com',
  instagram: 'https://www.instagram.com/makyp_creations/',
  tiktok: 'https://www.tiktok.com/@makyp_creations',
  facebook: '#',
  location: 'Colombia',
}

export const whatsappMessages = {
  general: 'Hola Makyp Creations 💜 Quiero más información sobre sus detalles.',
  product: (name: string, price: string) =>
    `Hola 💜 Me interesa el/la ${name} (${price}). ¿Está disponible?`,
  cart: (lines: string[], total: string) =>
    `Hola Makyp Creations 💜 Quiero pedir:\n${lines.join('\n')}\n\nTotal: ${total}`,
  customizer: (details: string[]) =>
    `Hola Makyp Creations 💜 Quiero pedir un ramo personalizado:\n${details.join('\n')}\n\n¿Cuánto tardaría y cuánto costaría?`,
}
