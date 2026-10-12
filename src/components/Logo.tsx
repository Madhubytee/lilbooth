import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="lil booth home">
      <span className="logo-mark" aria-hidden="true">
        <span style={{ background: 'var(--pink)' }} />
        <span style={{ background: 'var(--butter)' }} />
        <span style={{ background: 'var(--sky)' }} />
      </span>
      <span className="logo-word">lil booth</span>
    </Link>
  );
}
