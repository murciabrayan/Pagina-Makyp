/**
 * Punto único de salida de las métricas.
 *
 * Si la página tiene un `dataLayer` (lo crea Google Tag Manager o gtag.js),
 * el evento se le entrega y desde ahí se enruta a donde haga falta. Si no lo
 * tiene, el evento se queda en la consola en desarrollo y no pasa nada más:
 * así no hay que tocar los 40 y pico `track()` repartidos por la app el día
 * que se conecte la medición, basta con pegar el snippet en `index.html`.
 */
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function track(event: string, payload?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.debug(`[track] ${event}`, payload)
  }

  try {
    window.dataLayer?.push({ event, ...payload })
  } catch {
    // la medición nunca puede tumbar una compra
  }
}
