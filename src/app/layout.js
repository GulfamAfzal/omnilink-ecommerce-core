import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import ClientHeader from '@/components/ClientHeader';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "OMS OMNILINK | Enterprise Solutions",
  description: "Next-generation global order management and unified provisioning for sharded distributed networks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body style={bodyStyle}>
        <ClientHeader />

        <main style={mainContent}>{children}</main>

        <footer style={footerStyle}>
          <div style={footerContainer}>
            <div style={footerGrid}>
              <div style={footerCol}>
                <h4 style={footerHead}>OMS OMNILINK</h4>
                <p style={footerDesc}>Next-generation global order management.</p>
              </div>
              <div style={footerCol}>
                <h4 style={footerHead}>Platform</h4>
                <Link href="/" style={footerLink}>Infrastructure</Link>
                <Link href="/" style={footerLink}>Security</Link>
              </div>
            </div>
            <div style={bottomBar}>
              <p>© 2026 OMS OMNILINK Systems Inc.</p>
              <p>Status: <span style={{color: '#10b981'}}>Operational</span></p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

// --- UPDATED STYLES ---
const bodyStyle = { margin: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' };
const mainContent = { flex: 1 };
const footerStyle = { backgroundColor: '#0f172a', borderTop: '4px solid #6366f1', padding: '60px 0 30px 0', color: 'white' };
const footerContainer = { maxWidth: '1400px', margin: '0 auto', padding: '0 32px' };
const footerGrid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '60px', marginBottom: '40px' };
const footerCol = { display: 'flex', flexDirection: 'column', gap: '16px' };
const footerHead = { fontSize: '15px', fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '1px' };
const footerDesc = { fontSize: '14px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.6' };
const footerLink = { color: '#94a3b8', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' };
const bottomBar = { borderTop: '1px solid #1e293b', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' };