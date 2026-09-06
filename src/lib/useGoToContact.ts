import type { MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useGoToContact() {
  const navigate = useNavigate()
  const location = useLocation()

  return (event: MouseEvent) => {
    event.preventDefault()
    if (location.pathname === '/') {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollToContact: true } })
    }
  }
}
