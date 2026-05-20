import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import AIChatWidget from './AIChatWidget'

export default function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <BottomNav />
      <AIChatWidget />
    </>
  )
}
