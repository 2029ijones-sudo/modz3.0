import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Modz - Metaverse Builder',
  description: 'A 3D metaverse creation platform with mod management and AI code editing',
  keywords: 'metaverse, 3D, webgl, three.js, modding, coding, AI editor',
  authors: [{ name: 'Modz Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0a0a1a',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/Modz.png', sizes: '192x192', type: 'image/png' },
      { url: '/Modz.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/Modz.png' },
    ],
  },
  openGraph: {
    title: 'Modz - Metaverse Builder',
    description: 'Create and customize your own 3D metaverse worlds',
    type: 'website',
    url: 'https://modz.app',
    images: ['/Modz.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Modz - Metaverse Builder',
    description: 'Create and customize your own 3D metaverse worlds',
    images: ['/Modz.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to CDNs for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://kit.fontawesome.com" />
        
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        
        {/* Preload critical resources */}
        <link rel="preload" as="style" href="/styles/three-components.css" />
        <link rel="preload" as="script" href="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" />
        
        {/* NoScript fallback */}
        <noscript>
          <style>{`
            .no-script-warning {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #ff4757;
              color: white;
              text-align: center;
              padding: 1rem;
              z-index: 9999;
              font-weight: bold;
            }
            .app-container {
              filter: blur(2px);
              opacity: 0.7;
            }
          `}</style>
          <div className="no-script-warning">
            ⚠️ JavaScript is required for Modz to function properly. Please enable JavaScript to continue.
          </div>
        </noscript>
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/Modz.png" />
        
        {/* Windows tile color */}
        <meta name="msapplication-TileColor" content="#0a0a1a" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Loading splash screen */}
        <div id="loading-splash" className="loading-splash">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-center"></div>
            </div>
            <div className="loading-text">
              <h2>Initializing Modz</h2>
              <p>Loading metaverse environment...</p>
              <div className="loading-progress">
                <div className="progress-bar"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main app container */}
        <div id="app-root">
          {children}
        </div>
        
        {/* Service Worker Registration (PWA) - FIXED: Remove process.env reference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Always register service worker in production (Vercel automatically sets NODE_ENV)
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  // Check if we're on the production domain
                  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    navigator.serviceWorker.register('/sw.js').then(
                      (registration) => {
                        console.log('Service Worker registered: ', registration);
                      },
                      (error) => {
                        console.log('Service Worker registration failed: ', error);
                      }
                    );
                  }
                });
              }
              
              // Remove loading splash when page is fully loaded
              window.addEventListener('load', () => {
                setTimeout(() => {
                  const splash = document.getElementById('loading-splash');
                  if (splash) {
                    splash.style.opacity = '0';
                    splash.style.visibility = 'hidden';
                    setTimeout(() => splash.remove(), 500);
                  }
                }, 1000);
              });
              
              // Fallback: hide splash after 5 seconds max
              setTimeout(() => {
                const splash = document.getElementById('loading-splash');
                if (splash) {
                  splash.style.opacity = '0';
                  splash.style.visibility = 'hidden';
                  setTimeout(() => splash.remove(), 500);
                }
              }, 5000);
            `
          }}
        />
        
        {/* Global error handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                // Dispatch to React error boundary or show user-friendly message
                if (window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('app-error', {
                    detail: {
                      message: event.error.message,
                      stack: event.error.stack
                    }
                  }));
                }
              });
              
              window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                window.dispatchEvent(new CustomEvent('app-error', {
                  detail: {
                    message: event.reason?.message || 'Promise rejected',
                    stack: event.reason?.stack
                  }
                }));
              });
            `
          }}
        />
      </body>
    </html>
  )
}
