import { Inter } from "next/font/google";
import "./globals.css";
import ClientHeader from '@/components/ClientHeader';
import ParticleCanvas from '@/components/ParticleCanvas';
import Link from 'next/link';
import ChatBotWrapper from '@/components/ChatBotWrapper';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata = {
  title: "OMS OMNILINK | Enterprise Commerce",
  description: "Next-generation global order management and unified provisioning for distributed commerce networks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body style={bodyStyle} suppressHydrationWarning>
        <ParticleCanvas />
        <ClientHeader />
        <main style={mainStyle}>{children}</main>
        <ChatBotWrapper />
        <footer style={footerStyle}>
          <div style={footerInner}>
            <div style={footerGrid}>
              <div>
                <div style={footerBrand}>OMS <span style={{ color: '#06B6D4' }}>OMNILINK</span></div>
                <p style={footerDesc}>Next-generation global order management and unified provisioning for distributed commerce networks.</p>
                <div style={statusPill}>
                  <span style={statusDot} />
                  All Systems Operational
                </div>
              </div>
              <div>
                <div style={footerColHead}>Platform</div>
                <Link href="/" style={footerLink}>Marketplace</Link>
                <Link href="/profile" style={footerLink}>My Account</Link>
                <Link href="/admin/login" style={footerLink}>Admin Portal</Link>
              </div>
              <div>
                <div style={footerColHead}>Infrastructure</div>
                <span style={footerLink}>Azure SQL — Financial Core</span>
                <span style={footerLink}>MongoDB Atlas — Product Catalog</span>
                <span style={footerLink}>3 Global Regions</span>
              </div>
            </div>
            <div style={footerBottom}>
              <span>© 2026 OMS OMNILINK Systems Inc.</span>
              <span style={{ color: '#4B5563', fontSize: '0.75rem' }}>v2.0 — Glow Architecture</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

const bodyStyle = {
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #E6F0F6 0%, #F0F4F8 100%)',
  backgroundAttachment: 'fixed',
  fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
};
const mainStyle = { flex: 1 };

const footerStyle = {
  backgroundColor: '#111827',
  borderTop: '1px solid #1F2937',
  padding: '3rem 0 1.5rem',
  color: '#F9FAFB',
  marginTop: '4rem',
};
const footerInner = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 2rem',
};
const footerGrid = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  gap: '3rem',
  marginBottom: '2.5rem',
};
const footerBrand = {
  fontSize: '1.125rem',
  fontWeight: '800',
  color: '#F9FAFB',
  letterSpacing: '-0.3px',
  marginBottom: '0.75rem',
};
const footerDesc = {
  fontSize: '0.8125rem',
  color: '#6B7280',
  lineHeight: '1.6',
  maxWidth: '320px',
  marginBottom: '1rem',
};
const statusPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.75rem',
  color: '#10B981',
  backgroundColor: 'rgba(16,185,129,0.1)',
  border: '1px solid rgba(16,185,129,0.2)',
  padding: '0.25rem 0.75rem',
  borderRadius: '20px',
  fontWeight: '600',
};
const statusDot = {
  width: '6px',
  height: '6px',
  backgroundColor: '#10B981',
  borderRadius: '50%',
  boxShadow: '0 0 6px rgba(16,185,129,0.6)',
  display: 'inline-block',
  animation: 'pulse 2s ease-in-out infinite',
};
const footerColHead = {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '1rem',
};
const footerLink = {
  display: 'block',
  fontSize: '0.8125rem',
  color: '#6B7280',
  textDecoration: 'none',
  marginBottom: '0.5rem',
  transition: 'color 0.2s',
};
const footerBottom = {
  borderTop: '1px solid #1F2937',
  paddingTop: '1.25rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  color: '#4B5563',
};