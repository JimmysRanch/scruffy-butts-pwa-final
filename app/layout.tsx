import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Scruffy Butts – Grooming',
  description: 'Book dog grooming in Natalia, TX with Scruffy Butts',
  manifest: '/manifest.webmanifest',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon-180.png' }
  ]
}

/**
 * RootLayout defines the outer chrome for every page.  It includes a sticky
 * header, primary navigation, and a simple footer.  The children are
 * rendered inside the main element.  The layout file also imports
 * global styles and provides metadata for the PWA manifest and icons.
 */
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight text-primary"
            >
              Scruffy Butts
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/book" className="hover:underline">
                Book
              </Link>
              <Link href="/admin" className="hover:underline">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="grow mx-auto max-w-5xl w-full px-4 py-8">{children}</main>
        <footer className="border-t bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500">
            © {new Date().getFullYear()} Scruffy Butts · Natalia, TX
          </div>
        </footer>
      </body>
    </html>
  )
}
