import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/** Root layout – public pages */
const Layout = () => (
  <div className="flex flex-col min-h-screen bg-brand-bg">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
)

export default Layout
