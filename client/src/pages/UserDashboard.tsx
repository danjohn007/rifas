import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const UserDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Mi Cuenta</h1>
      <p>¡Bienvenido, {user.name}!</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Información de la Cuenta</h2>
        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Teléfono:</strong> {user.phone}</p>
          <p><strong>Rol:</strong> {user.role}</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Mis Boletos</h2>
        <p>Aquí aparecerán tus boletos comprados. Esta funcionalidad se implementará próximamente.</p>
      </div>
    </div>
  );
};

export default UserDashboard;