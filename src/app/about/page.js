'use client';
import Link from 'next/link';
import { Database, Server, Globe, Layers, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

const METRICS = [
  { value: '50K+', label: 'Orders Processed' },
  { value: '3',    label: 'Global Regions' },
  { value: '2',    label: 'Database Engines' },
  { value: '99.9%', label: 'Uptime SLA' },
];

const ARCH = [
  {
    icon: Database, color: '#2563EB', bg: 'rgba(37,99,235,0.08)',
    title: 'Azure SQL — Financial Core',
    sub: 'OMS_Financial_Core database',
    points: [
      'Orders, payments, and tax ledgers',
      'User accounts and regional settings',
      'ACID-compliant transaction guarantees',
      'T-SQL stored procedures for reporting',
    ],
  },
  {
    icon: Server, color: '#10B981', bg: 'rgba(16,185,129,0.08)',
    title: 'MongoDB Atlas — Product Catalog',
    sub: 'OMS_Product_Catalog cluster',
    points: [
      'Rich product documents & variants',
      'Cart sessions and review collections',
      'Inventory aggregation per region',
      'Flexible schema for diverse categories',
    ],
  },
  {
    icon: Globe, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
    title: 'Global Region Routing',
    sub: '3 regional deployment hubs',
    points: [
      'South Asia — primary hub (Lahore)',
      'North America — secondary hub',
      'Europe — tertiary hub',
      'Dynamic tax & shipping by region',
    ],
  },
];

const PRINCIPLES = [
  { icon: Layers,      title: 'Polyglot Persistence', desc: 'Right database for the right data type — no one-size-fits-all compromise.' },
  { icon: Zap,         title: 'High Throughput',       desc: 'Asynchronous order processing pipelines sustain peak commerce loads.' },
  { icon: ShieldCheck, title: 'Security First',         desc: 'JWT sessions, role-based access control, and encrypted data at rest.' },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

        {/* Hero */}
        <div style={hero}>
          <div style={{ flex: 1 }}>
            <span style={heroTag}>About OMNILINK</span>
            <h1 style={{ fontSize: '40px', fontWeight: '900', color: '#0F172A', margin: '16px 0 20px', lineHeight: '1.15', letterSpacing: '-1px' }}>
              Distributed Commerce,<br />
              <span style={{ color: '#06B6D4' }}>Unified Intelligence</span>
            </h1>
            <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.75', maxWidth: '480px', marginBottom: '32px' }}>
              OMNILINK is a next-generation Order Management System built on a polyglot persistence architecture — 
              routing high-integrity financial data through Azure SQL while delivering rich product catalog experiences 
              via MongoDB Atlas, all synchronized across three global commerce hubs.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/" style={btnCyan}>Browse Catalog <ArrowRight size={14} strokeWidth={2.5} /></Link>
              <Link href="/contact" style={btnOutline}>Contact Us</Link>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {METRICS.map(m => (
              <div key={m.label} style={metricCard}>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', letterSpacing: '-1px' }}>{m.value}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Section */}
        <div style={{ marginTop: '64px', marginBottom: '16px' }}>
          <span style={sectionTag}>Architecture</span>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '12px', letterSpacing: '-0.5px' }}>Polyglot Persistence Stack</h2>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '8px', maxWidth: '600px' }}>
            Each layer of the OMNILINK infrastructure is purpose-built for its data domain, ensuring optimal performance, consistency, and scalability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '32px' }}>
          {ARCH.map(({ icon: Icon, color, bg, title, sub, points }) => (
            <div key={title} style={archCard}>
              <div style={{ width: '48px', height: '48px', backgroundColor: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Icon size={24} color={color} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>{title}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>{sub}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {points.map(p => (
                  <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#334155' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, flexShrink: 0, marginTop: '5px' }}></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Principles */}
        <div style={{ marginTop: '64px', marginBottom: '32px' }}>
          <span style={sectionTag}>Design Principles</span>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '12px', letterSpacing: '-0.5px' }}>Built for Scale</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {PRINCIPLES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={principleCard}>
              <Icon size={28} color="#06B6D4" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.65' }}>{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ─── Styles ─── */
const hero = {
  display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '24px', padding: '48px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
};
const heroTag = {
  display: 'inline-block', fontSize: '11px', fontWeight: '800', color: '#06B6D4',
  backgroundColor: 'rgba(6,182,212,0.1)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(6,182,212,0.2)',
  padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px',
};
const metricCard = {
  backgroundColor: '#EBF2F7',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '16px', padding: '20px 24px',
};
const sectionTag = {
  display: 'inline-block', fontSize: '11px', fontWeight: '800', color: '#64748B',
  textTransform: 'uppercase', letterSpacing: '1px',
  backgroundColor: '#EBF2F7', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  padding: '4px 12px', borderRadius: '20px',
};
const archCard = {
  backgroundColor: '#FFFFFF',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '20px', padding: '28px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
};
const principleCard = {
  backgroundColor: '#D9E6F0',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '20px', padding: '28px',
};
const btnCyan    = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 24px', background: 'linear-gradient(135deg, #06B6D4, #2563EB)', color: '#FFFFFF', borderRadius: '10px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' };
const btnOutline = { display: 'inline-flex', alignItems: 'center', padding: '12px 24px', backgroundColor: '#EBF2F7', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', color: '#0F172A', borderRadius: '10px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' };
