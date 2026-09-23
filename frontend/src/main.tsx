import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ContentProvider } from '@/context/ContentContext'
import { CartProvider } from '@/context/CartContext'
import App from './App.tsx'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/*
        El orden importa: la sesión primero, porque el contenido puede pedirse
        como equipo (y entonces incluye lo que está sin publicar); el carrito
        al final, porque necesita el catálogo para rehidratarse.
      */}
      <AuthProvider>
        <ContentProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ContentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
