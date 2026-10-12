import { useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { EXAMPLE_THUMB } from '../components/Camera';
import Demo from '../components/Demo';
import Logo from '../components/Logo';
import Sticker from '../components/Sticker';
import { cssFilter, getFilter, type FilterId } from '../lib/filters';

const POSES = ['34% 22%', '40% 28%', '30% 26%', '38% 20%'];

function Shot({ filter, i, h }: { filter: FilterId; i: number; h: number }) {
  const style: CSSProperties = {
    height: h,
    backgroundImage: `url(${EXAMPLE_THUMB})`,
    backgroundSize: '240%',
    backgroundPosition: POSES[i % POSES.length],
    filter: cssFilter(getFilter(filter)),
  };
  return <div style={style} />;
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
              Design your own strip with filters, frames, stickers and a caption. Then smile for four shots and send it to your
              inbox.
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
            <div className="hero-strip hero-strip-1">
              {[0, 1, 2, 3].map((i) => (
                <Shot key={i} filter="bw" i={i} h={90} />
              ))}
            </div>
            <div className="hero-strip hero-strip-2">
              {[0, 1, 2, 3].map((i) => (
                <Shot key={i} filter="softpink" i={i + 1} h={106} />
              ))}
              <span className="hero-strip-caption">besties ♡</span>
            </div>
            <div className="hero-strip hero-strip-3">
              {[0, 1, 2, 3].map((i) => (
                <Shot key={i} filter="film" i={i + 2} h={88} />
              ))}
            </div>
            <Sticker id="heart" color="#F4A7B9" size={46} outline className="hero-sticker hero-heart" />
            <Sticker id="star" color="#FFE29A" size={40} outline className="hero-sticker hero-star" />
            <Sticker id="sparkle" color="#A9D3F5" size={30} className="hero-sticker hero-sparkle" />
          </div>
        </section>

        <section id="demo" className="band" aria-label="Demo">
          <Demo />
        </section>

        <section id="make" className="make">
          <div className="make-head">
            <h2 className="h2">
              every strip is
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
                <span className="sq40" style={{ background: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px #E6DEDF' }} />
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
                      'repeating-linear-gradient(0deg, rgba(169,211,245,0.55) 0 5px, transparent 5px 10px), repeating-linear-gradient(90deg, rgba(169,211,245,0.55) 0 5px, transparent 5px 10px)',
                  }}
                />
                <span className="sq40" style={{ background: '#2B2326' }} />
              </div>
              <div className="make-text">
                <h3>frames</h3>
                <p>classic white, polka, gingham, film and solid colors</p>
              </div>
            </div>
            <div className="make-cell">
              <div className="make-art make-art-center">
                <Sticker id="heart" color="#F4A7B9" size={34} />
                <Sticker id="star" color="#FFE29A" size={34} />
                <Sticker id="bow" color="#A9D3F5" accent="#7FB6E3" size={40} />
                <Sticker id="sparkle" color="#BFE6CF" size={32} />
              </div>
              <div className="make-text">
                <h3>stickers</h3>
                <p>hearts, stars, bows, sparkles and tiny flowers</p>
              </div>
            </div>
            <div className="make-cell">
              <div className="make-art make-art-base">
                <span className="aa-serif" style={{ fontSize: 34 }}>
                  Aa
                </span>
                <span className="aa-bold" style={{ fontSize: 26 }}>
                  Aa
                </span>
                <span className="aa-type" style={{ fontSize: 26 }}>
                  Aa
                </span>
              </div>
              <div className="make-text">
                <h3>caption</h3>
                <p>add a little line and the date at the bottom</p>
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
                <span className="how-desc">Pick a filter, a layout, a frame, stickers and your caption.</span>
              </div>
            </li>
            <li>
              <span className="how-num" style={{ color: '#A87410' }}>
                2
              </span>
              <div>
                <span className="how-step">strike four poses</span>
                <span className="how-desc">A 3, 2, 1 countdown before each shot so you have time to switch it up.</span>
              </div>
            </li>
            <li>
              <span className="how-num" style={{ color: '#3F7FB5' }}>
                3
              </span>
              <div>
                <span className="how-step">send it</span>
                <span className="how-desc">Email the strip to yourself and your friends, or download the image.</span>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-word">lil booth</span>
        <span>photos stay on your device until you send them</span>
      </footer>
    </div>
  );
}
