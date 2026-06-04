import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { LanguageProvider } from '@/lib/useLanguage'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Footer from './components/Footer'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <Header />
            <Navigation />
            <main className="main-content">
              <div className="main-wrapper">
                {children}
              </div>
            </main>
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
