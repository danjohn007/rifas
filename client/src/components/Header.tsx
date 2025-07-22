import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>🎫 Rifas de Autos</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/" className="nav-link">Inicio</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Mi Cuenta</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link">Administración</Link>
              )}
              <span className="user-info">¡Hola, {user.name}!</span>
              <button onClick={handleLogout} className="btn btn-outline">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn btn-primary">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;