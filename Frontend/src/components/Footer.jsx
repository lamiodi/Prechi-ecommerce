import React from 'react';
import { Link } from 'react-router-dom';
import { InstagramLogo, ThreadsLogo, EnvelopeSimple, Phone, ArrowUpRight } from '@phosphor-icons/react';
import Logo from '../assets/icons/Preachilogowhite.png';

const Footer = ({ inverted }) => {
  const year = new Date().getFullYear();
  const bg = inverted ? 'bg-Secondarycolor' : 'bg-Primarycolor';
  const text = inverted ? 'text-Primarycolor' : 'text-white';
  const textMuted = inverted ? 'text-Primarycolor/50' : 'text-white/40';
  const textSoft = inverted ? 'text-Primarycolor/70' : 'text-white/60';
  const border = inverted ? 'border-Primarycolor/10' : 'border-white/10';
  const hoverText = inverted ? 'hover:text-Primarycolor' : 'hover:text-white';

  return (
    <footer className={`${bg} ${text}`} role="contentinfo">
      <div className="section-container py-16 md:py-20 lg:py-24">

        {/* Newsletter + CTA row */}
        <div className={`pb-12 md:pb-16 mb-12 md:mb-16 border-b ${border}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end">
            <div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-semibold tracking-tight leading-tight ${text}`}>
                Be the first to know<br className="hidden sm:block" /> about new drops.
              </h2>
            </div>
            <div>
              <p className={`text-sm ${textSoft} font-display mb-5 max-w-sm`}>
                Sign up for exclusive access to new releases, restocks, and member-only offers.
              </p>
              <Link
                to="/signup"
                className={`inline-flex items-center gap-2 text-sm font-display font-medium tracking-[0.04em] uppercase ${text} ${hoverText} group transition-colors duration-300`}
              >
                Create account
                <ArrowUpRight size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {/* Shop */}
          <div>
            <h3 className={`text-xs font-display font-medium tracking-[0.1em] uppercase ${textMuted} mb-5`}>
              Shop
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/shop?category=new', label: 'New arrivals' },
                { to: '/shop?category=Sets', label: 'Sets' },
                { to: '/shop?category=Tracksuits', label: 'Tracksuits' },
                { to: '/shop', label: 'All products' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className={`text-sm font-display ${textSoft} ${hoverText} transition-colors duration-300`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className={`text-xs font-display font-medium tracking-[0.1em] uppercase ${textMuted} mb-5`}>
              Help
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/help', label: 'Size guide' },
                { to: '/help', label: 'Shipping' },
                { to: '/help', label: 'Returns' },
                { to: '/help', label: 'FAQ' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className={`text-sm font-display ${textSoft} ${hoverText} transition-colors duration-300`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className={`text-xs font-display font-medium tracking-[0.1em] uppercase ${textMuted} mb-5`}>
              Company
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/more', label: 'About us' },
                { to: '/more', label: 'Terms' },
                { to: '/more', label: 'Privacy' },
                { to: '/help', label: 'Contact' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className={`text-sm font-display ${textSoft} ${hoverText} transition-colors duration-300`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={`text-xs font-display font-medium tracking-[0.1em] uppercase ${textMuted} mb-5`}>
              Reach us
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:Prechi.clothing@gmail.com"
                  className={`flex items-center gap-2 text-sm font-display ${textSoft} ${hoverText} transition-colors duration-300`}
                >
                  <EnvelopeSimple size={15} weight="light" className="flex-shrink-0" />
                  <span className="truncate">prechi.clothing@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+2349016420903"
                  className={`flex items-center gap-2 text-sm font-display ${textSoft} ${hoverText} transition-colors duration-300`}
                >
                  <Phone size={15} weight="light" className="flex-shrink-0" />
                  +234 901 642 0903
                </a>
              </li>
              <li className={`text-xs ${textMuted} font-display mt-2`}>
                Mon - Sun, 8:30am - 10pm WAT
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`pt-8 border-t ${border} flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
            <Link to="/home" aria-label="Prechi - Home">
              <img
                src={Logo}
                alt="Prechi"
                className={`h-6 w-auto ${inverted ? 'invert' : ''} opacity-60 hover:opacity-100 transition-opacity duration-300`}
              />
            </Link>
            <span className={`text-xs ${textMuted} font-display`}>
              &copy; {year} Prechi Clothing
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/prechi.clothing"
              target="_blank"
              rel="noopener noreferrer"
              className={`${textSoft} ${hoverText} transition-colors duration-300`}
              aria-label="Instagram"
            >
              <InstagramLogo size={20} weight="light" />
            </a>
            <a
              href="https://www.threads.com/@prechi.clothing"
              target="_blank"
              rel="noopener noreferrer"
              className={`${textSoft} ${hoverText} transition-colors duration-300`}
              aria-label="Threads"
            >
              <ThreadsLogo size={20} weight="light" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
