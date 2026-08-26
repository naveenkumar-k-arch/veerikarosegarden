import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, MessageSquare, Leaf, ArrowRight, Instagram, Youtube, Truck } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer style={{ background: 'white', borderTop: '2px solid #dcfce7', marginTop: 0 }}>
      {/* PhonePe banner */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderBottom: '1px solid #bbf7d0' }}>
        <div className="section-container" style={{ padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: 'white', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 12px rgba(22,163,74,0.1)' }}>
                <ShieldCheck style={{ width: 22, height: 22, color: '#16a34a' }} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>PhonePe 100% Secure Payment Gateway</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Encrypted UPI, Cards, NetBanking & QR payments with instant confirmation</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'white', border: '1.5px solid #bbf7d0', boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Verified Merchant:</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-green-dark)', letterSpacing: '0.06em' }}>VEERIKA ROSE GARDEN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="section-container" style={{ padding: '52px 24px 36px' }}>
        <div className="footer-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36, marginBottom: 44 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #16a34a', boxShadow: '0 0 0 3px #dcfce7', flexShrink: 0 }}>
                <img src="/logo.png" alt="Veerika Rose Garden" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                  Veerika <em style={{ color: 'var(--color-rose)', fontStyle: 'italic' }}>Rose Garden</em>
                </h3>
                <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>வீரிகா ரோஜா கார்டன்</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
              Premier nursery supplying authentic hybrid roses, grafted fruit trees, jasmine, medicinal plants and organic vermicompost directly from our farm.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              <Leaf style={{ width: 13, height: 13, color: 'var(--color-green)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 700 }}>100% Healthy Saplings Guarantee</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { Icon: Instagram, href: '#', label: 'Instagram', color: '#db2777', bg: '#fdf2f8' },
                { Icon: Youtube, href: '#', label: 'YouTube', color: '#dc2626', bg: '#fef2f2' },
                { Icon: MessageSquare, href: 'https://wa.me/917200826129', label: 'WhatsApp', color: '#16a34a', bg: '#f0fdf4' },
              ].map(({ Icon, href, label, color, bg }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" title={label} style={{
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bg, border: '1.5px solid transparent', borderRadius: 10,
                  color, textDecoration: 'none', transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-green-dark)', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #dcfce7' }}>
              Plant Categories
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {['Hybrid Roses', 'Grafted Fruit Trees', 'Jasmine & Flowers', 'Medicinal Plants', 'Indoor Plants', 'Organic Fertilizers'].map(item => (
                <li key={item}>
                  <button onClick={() => onNavigate('shop')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    color: 'var(--text-muted)', fontSize: 12, padding: 0, transition: 'color 0.2s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green-light)', flexShrink: 0 }} />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-green-dark)', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #dcfce7' }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { label: 'Shop All Plants', page: 'shop' },
                { label: 'My Account', page: 'account' },
                { label: 'Track My Order', page: 'order-status' },
                { label: 'Shipping Policy', page: 'policies' },
                { label: 'Refund Policy', page: 'policies' },
              ].map(({ label, page }) => (
                <li key={label}>
                  <button onClick={() => onNavigate(page)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    color: 'var(--text-muted)', fontSize: 12, padding: 0, transition: 'color 0.2s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                  >
                    <ArrowRight style={{ width: 11, height: 11 }} /> {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-green-dark)', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #dcfce7' }}>
              Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                { Icon: MapPin, text: 'Pennagaram, Tamil Nadu — 636810', href: '#', color: '#dc2626' },
                { Icon: Phone, text: '+91 72008 26129', href: 'tel:+917200826129', color: '#16a34a' },
                { Icon: MessageSquare, text: 'WhatsApp Us', href: 'https://wa.me/917200826129', color: '#16a34a' },
                { Icon: Mail, text: 'support@veerikarosegarden.com', href: 'mailto:support@veerikarosegarden.com', color: '#7c3aed' },
                { Icon: Clock, text: 'Open 7 AM – 7 PM · All Days', href: null, color: '#f59e0b' },
                { Icon: Truck, text: 'Delivery: Monday to Friday', href: null, color: '#16a34a' },
              ].map(({ Icon, text, href, color }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 13, height: 13, color }} />
                  </div>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                      style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', lineHeight: 1.5, transition: 'color 0.2s ease', paddingTop: 4 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                    >{text}</a>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, paddingTop: 4 }}>{text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: 22, borderTop: '1.5px solid #f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--text-light)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>© {new Date().getFullYear()} Veerika Rose Garden Nursery. All rights reserved.</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>
              This website built by{' '}
              <a
                href="https://myportfolio-five-rouge-12.vercel.app"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--color-green-dark, #15803d)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#047857'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark, #15803d)'; }}
              >
                Naveenkumar K
              </a>
            </span>
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(link => (
              <button key={link} onClick={() => onNavigate('policies')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--text-light)', padding: 0, transition: 'color 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-light)'; }}
              >{link}</button>
            ))}
            {/* Staff admin access */}
            <button onClick={() => onNavigate('admin')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: 'var(--text-light)', padding: 0,
              transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: 4,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-light)'; }}
            >⚙️ Staff Login</button>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .footer-main-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 400px) {
          .footer-main-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </footer>
  );
};
