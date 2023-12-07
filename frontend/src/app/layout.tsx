import type { Metadata } from 'next'
import './global.css';

export const metadata: Metadata = {
    title: 'Newton\'s Method Fractal Sandbox',
    description: 'Generates fractals using Newton\'s Method of finding zeroes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
