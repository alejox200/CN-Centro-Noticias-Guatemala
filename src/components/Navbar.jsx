import React from 'react';
import { Link } from 'react-router-dom';
import LogoImage from '../../Logotipo CN1.jpeg';
import { WaveText } from './WaveText';

function Navbar() {
  return (
    <header style={{ backgroundColor: 'var(--header-bg)', borderBottom: '4px solid var(--primary-green)', padding: '1rem 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={LogoImage} alt="Logo" style={{ height: '60px', marginRight: '1rem', borderRadius: '8px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 'bold', margin: '0', lineHeight: '1.2' }}>
              Centro Noticias 
            </h1>
            <span style={{ color: 'var(--secondary-orange)', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: '1' }}>Guatemala</span>
          </div>
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-main)', fontWeight: '600', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem' }}>
            <WaveText text="Inicio" />
          </Link>
          <Link to="/admin" style={{ color: 'var(--text-main)', fontWeight: '600', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem', backgroundColor: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
            <WaveText text="Admin" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
