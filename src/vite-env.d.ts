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
