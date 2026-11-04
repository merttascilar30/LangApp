import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const MENU = [
  { to: '/', ad: 'Modüller', end: true },
  { to: '/defter', ad: 'Hata Defteri' },
  { to: '/kartlar', ad: 'Kartlar' },
  { to: '/ilerleme', ad: 'İlerleme' },
  { to: '/ayarlar', ad: 'Ayarlar' },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <nav className="menu">
        {MENU.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}>
            {m.ad}
          </NavLink>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  )
}
