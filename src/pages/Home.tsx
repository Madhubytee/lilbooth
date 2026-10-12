import { useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import Demo from '../components/Demo';
import HeroCards from '../components/HeroCards';
import Logo from '../components/Logo';

function Png({ file, size, className, style }: { file: string; size: number; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={`/stickers/${file}`}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', ...style }}
      draggable={false}
    />
  );
}

export default function Home() {
  useEffect(() => {
    document.title = 'lil booth · a photobooth in your browser';
  }, []);

  return (
    <div className="page home">
      <header className="site-header site-header-home">
        <Logo />
        <nav className="nav" aria-label="Main">
          <a href="#demo">demo</a>
          <a href="#make">make it yours</a>
          <a href="#how">how it works</a>
          <Link to="/booth" className="nav-cta">
            open the booth
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />a photobooth in your browser
            </span>
            <h1 className="hero-title">
              little moments,
              <br />
              <em>printed pretty.</em>
            </h1>
            <p className="hero-lede">
              Pick a filter and one of ten paper templates, then smile through the countdown. Drag on stickers, add a caption, and download or share your card.
            </p>
            <div className="hero-ctas">
              <Link to="/booth" className="btn btn-ink btn-lg">
                start your strip
              </Link>
              <a href="#demo" className="btn btn-line btn-lg">
                <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14">
                  <path d="M0 0 L12 7 L0 14 Z" fill="#D9577A" />
                </svg>
                watch the demo
              </a>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <HeroCards />
            <Png file="03-silver-heart-locket.png" size={50} className="hero-sticker hero-heart" />
            <Png file="20-gold-star-charm.png" size={46} className="hero-sticker hero-star" />
            <Png file="05-iridescent-sparkle.png" size={36} className="hero-sticker hero-sparkle" />
          </div>
        </section>

        <section id="demo" className="band" aria-label="Demo">
          <Demo />
        </section>

        <section id="make" className="make">
          <div className="make-head">
            <h2 className="h2">
              every card is
              <br />
              <em>yours to design.</em>
            </h2>
            <p className="muted">Mix and match before you shoot. Change your mind after? Swap it on the result page.</p>
          </div>
          <div className="make-grid">
            <div className="make-cell">
              <div className="make-art">
                {['#E8DCD3', '#BDB6B4', '#F6CBD5', '#E6D5B5'].map((c) => (
                  <span key={c} className="sq40" style={{ background: c }} />
                ))}
              </div>
              <div className="make-text">
                <h3>filters</h3>
                <p>original, b&amp;w, soft pink, film, dreamy and more</p>
              </div>
            </div>
            <div className="make-cell">
              <div className="make-art">
                <span className="sq40" style={{ background: '#2A1E1A' }} />
                <span
                  className="sq40"
                  style={{
                    backgroundColor: '#FDE8ED',
                    backgroundImage: 'radial-gradient(#F4A7B9 2px, transparent 2.6px)',
                    backgroundSize: '10px 10px',
                  }}
                />
                <span
                  className="sq40"
                  style={{
                    backgroundColor: '#FFFFFF',
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(244,167,185,0.35) 0 5px, transparent 5px 10px), repeating-linear-gradient(90deg, rgba(244,167,185,0.35) 0 5px, transparent 5px 10px)',
                  }}
                />
                <span className="sq40" style={{ background: '#FFF9EF', boxShadow: 'inset 0 0 0 3px #FFF9EF, inset 0 0 0 4.5px #BD8A98' }} />
              </div>
              <div className="make-text">
                <h3>ten templates</h3>
                <p>film negative, contact sheet, slide mount, blush polka, love letter, magazine and more</p>
              </div>
            </div>
            <div className="make-cell">
              <div className="make-art make-art-center" aria-hidden="true">
                <span className="mini-layout mini-strip">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mini-layout mini-double">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mini-layout mini-grid">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="make-text">
                <h3>six layouts</h3>
                <p>strip, trio, double strip, double trio, grid and big grid, with 3 to 8 shots</p>
              </div>
            </div>
            <div className="make-cell">
              <div className="make-art make-art-center">
                <Png file="01-silk-bow.png" size={40} />
                <Png file="07-cherries.png" size={38} />
                <Png file="14-blue-butterfly.png" size={40} />
                <Png file="11-disco-ball.png" size={36} />
              </div>
              <div className="make-text">
                <h3>stickers</h3>
                <p>twenty scrapbook stickers to drag, resize and spin anywhere on your card</p>
              </div>
            </div>
            <div className="make-cell">
              <div className="make-art make-art-base">
                <span className="aa-serif" style={{ fontSize: 34 }}>
                  Aa
                </span>
                <span className="aa-type" style={{ fontSize: 26 }}>
                  Aa
                </span>
                <span className="aa-hand" style={{ fontSize: 32 }}>
                  Aa
                </span>
              </div>
              <div className="make-text">
                <h3>caption</h3>
                <p>a little line and the date, lettered to match each template</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="how">
          <h2 className="h2 how-title">
            how it
            <br />
            works
          </h2>
          <ol className="how-list">
            <li>
              <span className="how-num" style={{ color: '#D9577A' }}>
                1
              </span>
              <div>
                <span className="how-step">design it</span>
                <span className="how-desc">Pick a filter, a layout, a template and your caption.</span>
              </div>
            </li>
            <li>
              <span className="how-num" style={{ color: '#A87410' }}>
                2
              </span>
              <div>
                <span className="how-step">strike your poses</span>
                <span className="how-desc">A 3, 2, 1 countdown before each shot so you have time to switch it up. Then add stickers.</span>
              </div>
            </li>
            <li>
              <span className="how-num" style={{ color: '#3F7FB5' }}>
                3
              </span>
              <div>
                <span className="how-step">download or share it</span>
                <span className="how-desc">Save your card as a PNG, or share it straight from your phone. Each photo on its own too.</span>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-word">lil booth</span>
        <span>your photos never leave your device</span>
      </footer>
    </div>
  );
}
