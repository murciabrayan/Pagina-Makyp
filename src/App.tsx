import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { Hero } from '@/components/sections/Hero'
import { CategoryStrip } from '@/components/sections/CategoryStrip'
import { TiendaCta } from '@/components/sections/TiendaCta'
import { ValueProps } from '@/components/sections/ValueProps'
import { SocialGallery } from '@/components/sections/SocialGallery'
import { ComingSoon } from '@/pages/ComingSoon'
import { Tienda } from '@/pages/Tienda'
import { Cart } from '@/pages/Cart'
import { CrearMiRamo } from '@/pages/CrearMiRamo'
import { Ayuda } from '@/pages/Ayuda'
import { categories } from '@/data/categories'
import { site } from '@/data/site'

const galleryImages = [
  '/products/1.jpg',
  '/products/3.webp',
  '/products/6.webp',
  '/products/9.webp',
  '/products/11.webp',
  '/products/15.webp',
  '/products/17.webp',
]

function Home() {
  // el desplazamiento al entrar (arriba, o al pie si vienen de Contacto)
  // lo maneja ScrollToTop, en un solo lugar para toda la app
  return (
    <Layout>
      <Hero />
      <CategoryStrip categories={categories} />
      <TiendaCta />
      <ValueProps />
      <SocialGallery images={galleryImages} instagramUrl={site.instagram} />
    </Layout>
  )
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/crear-mi-ramo" element={<CrearMiRamo />} />
        <Route path="/personalizados" element={<ComingSoon title="Personalizados" />} />
        <Route path="/ayuda" element={<Ayuda />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="*" element={<ComingSoon title="Página no encontrada" />} />
      </Routes>
    </>
  )
}

export default App
