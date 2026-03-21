import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };

  const links = user
    ? [{ to:'/dashboard', label:'Dashboard' }, { to:'/exchange', label:'Exchange' }, { to:'/history', label:'History' }, { to:'/rates', label:'Live Rates' }, { to:'/profile', label:'Profile' }]
    : [{ to:'/rates', label:'Live Rates' }];

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to={user ? '/dashboard' : '/'} className="nav-brand">
          <span className="brand-dot">◆</span>
          <span className="brand-text">CurrEx<span className="brand-bank"> Bank</span></span>
        </Link>
        <div className={`nav-links ${open ? 'open' : ''}`}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? 'active' : ''}`} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          {user
            ? <button className="btn-ghost nav-logout" onClick={handleLogout}>Sign Out</button>
            : <>
                <Link to="/login" className="btn-ghost nav-auth-btn" onClick={() => setOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-primary nav-auth-btn" onClick={() => setOpen(false)}>Get Started</Link>
              </>
          }
        </div>
        <button className="nav-hamburger" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
