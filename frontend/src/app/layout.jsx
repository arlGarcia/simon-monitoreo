import { Inter } from 'next/font/google';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/app/globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SimonGO — Monitoreo IoT de Flotas',
  description: 'Tablero de control en tiempo real para el monitoreo de flotas de vehículos con alertas de combustible.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
