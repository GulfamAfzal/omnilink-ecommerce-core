'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calculator, CreditCard, Package, ShoppingBag, RefreshCw } from 'lucide-react';

const FAQS = [
  {
    category: 'Account & Delivery',
    icon: MapPin,
    color: '#2563EB',
    items: [
      {
        q: 'How do I change my registered delivery region?',
        a: 'Go to your Profile page and click "Edit Identity." You can update your region preference there. Note that changing your region will affect shipping fees and applicable tax rates on future orders. Contact support if you need to update orders already placed.',
      },
      {
        q: 'Can I ship to a different address than my profile?',
        a: 'Yes! During checkout, select "Enter New Address" and either type your address manually or use the GPS auto-detect feature to fill it in automatically.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery within Pakistan takes 3–5 business days. For South Asia region hub orders, same-day dispatch is available for orders placed before 2 PM.',
      },
    ],
  },
  {
    category: 'Pricing & Taxes',
    icon: Calculator,
    color: '#F59E0B',
    items: [
      {
        q: 'When is sales tax applied to my order?',
        a: 'Sales tax is calculated based on your delivery region. Pakistan orders are subject to 17% GST. International orders may vary. The tax amount is clearly shown in your order summary before you confirm checkout.',
      },
      {
        q: 'Are prices shown inclusive or exclusive of tax?',
        a: 'Product prices shown on listings are exclusive of tax. The final tax amount is calculated and displayed during checkout based on your delivery region.',
      },
      {
        q: 'Why did my shipping fee change?',
        a: 'Delivery fees are calculated based on your delivery region and distance from the regional warehouse. Using GPS auto-detect during checkout gives you the most accurate rate.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: CreditCard,
    color: '#10B981',
    items: [
      {
        q: 'What payment methods are accepted on OMNILINK?',
        a: 'We accept Cash on Delivery (COD) and online payments through JazzCash, EasyPaisa, MCB, Bank of Punjab (BOP), and HBL. Simply select your preferred method during checkout.',
      },
      {
        q: 'Is online payment secure?',
        a: 'Yes. All online transactions are processed through certified banking partners. We never store your banking credentials on our servers.',
      },
      {
        q: 'Can I cancel an order after placing it?',
        a: 'Orders can be cancelled within 1 hour of placement if they haven\'t been dispatched yet. Go to your Profile → Order History and select the order to cancel it.',
      },
    ],
  },
  {
    category: 'Orders & Tracking',
    icon: Package,
    color: '#8B5CF6',
    items: [
      {
        q: 'How do I track my order?',
        a: 'Visit your Profile page and navigate to the "Shipment" tab. You\'ll see a real-time step-by-step tracker showing your order\'s status from confirmation to delivery.',
      },
      {
        q: 'What do the order status labels mean?',
        a: '"Confirmed" means your order is logged. "Processing" means the warehouse is preparing it. "Dispatched" means it\'s with the courier. "Out for Delivery" means it\'s on its way to you today.',
      },
      {
        q: 'What if my order is marked delivered but I haven\'t received it?',
        a: 'Please contact our support team within 48 hours via the Contact page. Include your order number and we\'ll investigate with the courier partner immediately.',
      },
    ],
  },
];

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #B0C4DE' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', gap: '16px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', lineHeight: '1.4' }}>{question}</span>
        {open
          ? <ChevronUp size={18} color="#06B6D4" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          : <ChevronDown size={18} color="#94A3B8" strokeWidth={2} style={{ flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ paddingBottom: '18px', fontSize: '13px', color: '#475569', lineHeight: '1.7' }}>
          {answer}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState(null);

  const displayed = activeCategory ? FAQS.filter(f => f.category === activeCategory) : FAQS;

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={tagStyle}>Help Center</span>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', margin: '14px 0 12px', letterSpacing: '-0.5px' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', maxWidth: '520px', margin: '0 auto' }}>
            Find quick answers to common questions about orders, payments, delivery, and your account.
          </p>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={!activeCategory ? filterBtnActive : filterBtn}
          >
            All Topics
          </button>
          {FAQS.map(({ category, icon: Icon, color }) => (
            <button
              key={category}
              onClick={() => setActiveCategory(activeCategory === category ? null : category)}
              style={activeCategory === category ? filterBtnActive : filterBtn}
            >
              <Icon size={13} color={activeCategory === category ? '#FFFFFF' : color} strokeWidth={2} />
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Accordion Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {displayed.map(({ category, icon: Icon, color, items }) => (
            <div key={category} style={accordionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} strokeWidth={1.5} />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', margin: 0 }}>{category}</h2>
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>{items.length} questions</span>
              </div>

              {items.map(({ q, a }) => <AccordionItem key={q} question={q} answer={a} />)}
            </div>
          ))}
        </div>

        {/* Still need help? */}
        <div style={stillHelp}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={24} color="#06B6D4" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' }}>Still can't find an answer?</div>
              <div style={{ fontSize: '13px', color: '#475569' }}>Our support team is ready to help. Average response time is under 2 hours.</div>
            </div>
          </div>
          <a href="/contact" style={btnContact}>Contact Support</a>
        </div>

      </div>
    </div>
  );
}

/* ─── Styles ─── */
const tagStyle = { display: 'inline-block', fontSize: '11px', fontWeight: '800', color: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.1)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(6,182,212,0.2)', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' };
const filterBtn = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#FFFFFF', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', color: '#334155', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' };
const filterBtnActive = { ...filterBtn, backgroundColor: '#0F172A', borderColor: '#0F172A', color: '#FFFFFF' };
const accordionCard = { backgroundColor: '#FFFFFF', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', borderRadius: '20px', padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };
const stillHelp = { marginTop: '48px', backgroundColor: '#D9E6F0', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', borderRadius: '20px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' };
const btnContact = { display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #06B6D4, #2563EB)', color: '#FFFFFF', borderRadius: '10px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', flexShrink: 0 };
