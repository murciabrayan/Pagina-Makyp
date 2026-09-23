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
import { Login } from '@/pages/admin/Login'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { Panel } from '@/pages/admin/Panel'
import { AdminProductos } from '@/pages/admin/AdminProductos'
import { AdminCategorias } from '@/pages/admin/AdminCategorias'
import { AdminArmador } from '@/pages/admin/AdminArmador'
import { AdminContenido } from '@/pages/admin/AdminContenido'
import { RutaProtegida } from '@/components/admin/RutaProtegida'
import { useContent } from '@/context/ContentContext'
import { useTitulo } from '@/lib/useTitulo'

function Home() {
  // el desplazamiento al entrar (arriba, o al pie si vienen de Contacto)
  // lo maneja ScrollToTop, en un solo lugar para toda la app
  useTitulo()
  const { categories, gallery, valueProps, site } = useContent()

  return (
    <Layout>
      <Hero />
      <CategoryStrip categories={categories} />
      <TiendaCta />
      <ValueProps items={valueProps} />
      <SocialGallery images={gallery} instagramUrl={site.instagram} />
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

        {/*
          El panel. Vive dentro de la misma aplicación, no en otra dirección,
          para que el equipo pueda ver la tienda y editarla sin cambiar de
          sitio. Todo lo que cuelga de aquí pasa por RutaProtegida.
        */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <AdminLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<Panel />} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="categorias" element={<AdminCategorias />} />
          <Route path="armador" element={<AdminArmador />} />
          <Route path="contenido" element={<AdminContenido />} />
        </Route>

        <Route path="*" element={<ComingSoon title="Página no encontrada" />} />
      </Routes>
    </>
  )
}

export default App
