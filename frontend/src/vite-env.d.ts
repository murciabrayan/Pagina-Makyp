/// <reference types="vite/client" />

// La API de transiciones de vista aún no está en los tipos base del DOM
interface ViewTransition {
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
  skipTransition: () => void
}

interface Document {
  startViewTransition?: (callback: () => void) => ViewTransition
}

// Variables de entorno propias. Vite solo expone al navegador las que
// empiezan por VITE_, y declararlas aquí evita que un nombre mal escrito
// pase desapercibido hasta que algo falla en tiempo de ejecución.
interface ImportMetaEnv {
  /** Dirección base de la API, con /api al final y sin barra final. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
