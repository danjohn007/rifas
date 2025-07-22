import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Panel de Administración</h1>
      <p>¡Bienvenido al panel de administración, {user.name}!</p>
      
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Gestión de Rifas</h3>
          <p>Crear, editar y administrar rifas de automóviles.</p>
          <button style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Ver Rifas
          </button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Boletos Vendidos</h3>
          <p>Revisar boletos vendidos y pagos pendientes.</p>
          <button style={{ padding: '0.5rem 1rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
            Ver Boletos
          </button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Determinación de Ganadores</h3>
          <p>Procesar resultados de la Lotería Nacional.</p>
          <button style={{ padding: '0.5rem 1rem', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
            Procesar Sorteos
          </button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Reportes</h3>
          <p>Ver estadísticas y reportes de ventas.</p>
          <button style={{ padding: '0.5rem 1rem', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>
            Ver Reportes
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Acciones Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button style={{ padding: '0.75rem 1.5rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Crear Nueva Rifa
          </button>
          <button style={{ padding: '0.75rem 1.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
            Verificar Pagos
          </button>
          <button style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
            Consultar Lotería Nacional
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;