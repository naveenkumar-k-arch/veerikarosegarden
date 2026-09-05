import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, MessageSquare, Leaf, ArrowRight, Instagram, Youtube, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

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
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                  {isTa ? 'போன்பே 100% பாதுகாப்பான கட்டண தளம்' : 'PhonePe 100% Secure Payment Gateway'}
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  {isTa ? 'பாதுகாப்பான யுபிஐ, கார்டு, நெட்பேங்கிங் & கியூஆர் உடனடி கட்டணம்' : 'Encrypted UPI, Cards, NetBanking & QR payments with instant confirmation'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'white', border: '1.5px solid #bbf7d0', boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {isTa ? 'அங்கீகரிக்கப்பட்ட வணிகர்:' : 'Verified Merchant:'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-green-dark)', letterSpacing: '0.06em' }}>
                {isTa ? 'வீரிகா ரோஜா கார்டன்' : 'VEERIKA ROSE GARDEN'}
              </span>
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
                <img src="/logo.webp" alt="Veerika Rose Garden" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: isTa ? 'var(--font-tamil)' : 'var(--font-display)', fontSize: isTa ? 16 : 17, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                  {isTa ? 'வீரிகா ரோஜா தோட்டம்' : (
                    <>Veerika <em style={{ color: 'var(--color-rose)', fontStyle: 'italic' }}>Rose Garden</em></>
                  )}
                </h3>
                <p style={{ fontFamily: 'var(--font-tamil)', fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                  {isTa ? 'பென்னாகரம், தர்மபுரி' : 'வீரிகா ரோஜா கார்டன்'}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 14 }}>
              {isTa
                ? 'அசல் ஹைப்ரிட் ரோஜாக்கள், ஒட்டு பழ மரங்கள், மல்லிகை, மூலிகைச் செடிகள் மற்றும் இயற்கை உரங்களை எங்கள் பண்ணையிலிருந்து நேரடியாக வழங்கும் முதன்மை நர்சரி.'
                : 'Premier nursery supplying authentic hybrid roses, grafted fruit trees, jasmine, medicinal plants and organic vermicompost directly from our farm.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              <Leaf style={{ width: 13, height: 13, color: 'var(--color-green)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 700 }}>
                {isTa ? '100% ஆரோக்கியமான செடிகள் உத்தரவாதம்' : '100% Healthy Saplings Guarantee'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { Icon: Instagram, href: '#', label: 'Instagram', color: '#db2777', bg: '#fdf2f8' },
                { Icon: Youtube, href: '#', label: 'YouTube', color: '#dc2626', bg: '#fef2f2' },
                { Icon: MessageSquare, href: 'https://wa.me/919361540714', label: isTa ? 'வாட்ஸ்அப்' : 'WhatsApp', color: '#16a34a', bg: '#f0fdf4' },
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
              {isTa ? 'செடி வகைகள்' : 'Plant Categories'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { en: 'Hybrid Roses', ta: 'ஹைப்ரிட் ரோஜாக்கள்' },
                { en: 'Grafted Fruit Trees', ta: 'ஒட்டு பழ மரங்கள்' },
                { en: 'Jasmine & Flowers', ta: 'மல்லிகை & பூச்செடிகள்' },
                { en: 'Medicinal Plants', ta: 'மூலிகைச் செடிகள்' },
                { en: 'Indoor Plants', ta: 'உள் அலங்காரச் செடிகள்' },
                { en: 'Organic Fertilizers', ta: 'இயற்கை உரங்கள்' },
              ].map(item => (
                <li key={item.en}>
                  <button onClick={() => onNavigate('shop')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    color: 'var(--text-muted)', fontSize: 12, padding: 0, transition: 'color 0.2s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green-light)', flexShrink: 0 }} />
                    {isTa ? item.ta : item.en}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-green-dark)', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #dcfce7' }}>
              {isTa ? 'முக்கிய இணைப்புகள்' : 'Quick Links'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { label: isTa ? 'அனைத்து செடிகள்' : 'Shop All Plants', page: 'shop' },
                { label: isTa ? 'எனது கணக்கு' : 'My Account', page: 'account' },
                { label: isTa ? 'ஆர்டரைக் கண்காணிக்க' : 'Track My Order', page: 'order-status' },
                { label: isTa ? 'ஷிப்பிங் கொள்கை' : 'Shipping Policy', page: 'policies' },
                { label: isTa ? 'பணத்திருப்புக் கொள்கை' : 'Refund Policy', page: 'policies' },
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
              {isTa ? 'தொடர்புக்கு' : 'Contact Us'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                { Icon: MapPin, text: isTa ? 'பென்னாகரம், தர்மபுரி — 636810' : 'Pennagaram, Tamil Nadu — 636810', href: '#', color: '#dc2626' },
                { Icon: Phone, text: '+91 72008 26129', href: 'tel:+917200826129', color: '#16a34a' },
                { Icon: MessageSquare, text: isTa ? 'வாட்ஸ்அப் உதவி' : 'WhatsApp Us', href: 'https://wa.me/919361540714', color: '#16a34a' },
                { Icon: Mail, text: 'support@veerikarosegarden.com', href: 'mailto:support@veerikarosegarden.com', color: '#7c3aed' },
                { Icon: Clock, text: isTa ? 'காலை 7 – இரவு 7 மணி வரை · அனைத்து நாட்களும்' : 'Open 7 AM – 7 PM · All Days', href: null, color: '#f59e0b' },
                { Icon: Truck, text: isTa ? 'டெலிவரி: திங்கள் முதல் வெள்ளி வரை' : 'Delivery: Monday to Friday', href: null, color: '#16a34a' },
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
            <span>
              {isTa ? `© ${new Date().getFullYear()} வீரிகா ரோஜா கார்டன் நர்சரி. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.` : `© ${new Date().getFullYear()} Veerika Rose Garden Nursery. All rights reserved.`}
            </span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>
              {isTa ? 'இணையதள உருவாக்கம்: ' : 'This website built by '}
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
            {[
              { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' },
              { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' },
              { en: 'Refund Policy', ta: 'பணத்திருப்புக் கொள்கை' },
            ].map(link => (
              <button key={link.en} onClick={() => onNavigate('policies')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--text-light)', padding: 0, transition: 'color 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-light)'; }}
              >
                {isTa ? link.ta : link.en}
              </button>
            ))}
            {/* Staff admin access */}
            <button onClick={() => onNavigate('admin')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: 'var(--text-light)', padding: 0,
              transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: 4,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-green-dark)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-light)'; }}
            >
              {isTa ? '⚙️ பணியாளர் உள்நுழைவு' : '⚙️ Staff Login'}
            </button>
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
