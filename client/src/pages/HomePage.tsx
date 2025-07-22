import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { raffleService } from '../services/raffleService';
import { Raffle } from '../types';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRaffles = async () => {
      try {
        const data = await raffleService.getPublicRaffles();
        setRaffles(data);
      } catch (err) {
        setError('Error al cargar las rifas');
        console.error('Error fetching raffles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRaffles();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="container">
          <div className="loading">Cargando rifas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <h1>🚗 ¡Gana el Auto de tus Sueños!</h1>
          <p>Participa en nuestras rifas oficiales. Boletos digitales seguros con números determinados por la Lotería Nacional de México.</p>
        </div>
      </div>

      <div className="container">
        <section className="raffles-section">
          <h2>Rifas Activas</h2>
          
          {raffles.length === 0 ? (
            <div className="no-raffles">
              <p>No hay rifas activas en este momento.</p>
              <p>¡Mantente atento para próximas rifas emocionantes!</p>
            </div>
          ) : (
            <div className="raffles-grid">
              {raffles.map((raffle) => (
                <div key={raffle._id} className="raffle-card">
                  <div className="raffle-image">
                    {raffle.carDetails.images.length > 0 ? (
                      <img 
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${raffle.carDetails.images[0]}`} 
                        alt={`${raffle.carDetails.brand} ${raffle.carDetails.model}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Auto+en+Rifa';
                        }}
                      />
                    ) : (
                      <div className="placeholder-image">
                        🚗 {raffle.carDetails.brand} {raffle.carDetails.model}
                      </div>
                    )}
                  </div>
                  
                  <div className="raffle-content">
                    <h3>{raffle.title}</h3>
                    <p className="car-details">
                      {raffle.carDetails.brand} {raffle.carDetails.model} {raffle.carDetails.year}
                    </p>
                    <p className="description">{raffle.description}</p>
                    
                    <div className="raffle-info">
                      <div className="info-item">
                        <span className="label">Precio por boleto:</span>
                        <span className="value">{formatCurrency(raffle.ticketPrice)}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="label">Boletos disponibles:</span>
                        <span className="value">{raffle.availableTickets} de {raffle.totalTickets}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="label">Fecha del sorteo:</span>
                        <span className="value">{formatDate(raffle.drawDate)}</span>
                      </div>
                    </div>
                    
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${(raffle.soldTickets / raffle.totalTickets) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="progress-text">
                      {Math.round((raffle.soldTickets / raffle.totalTickets) * 100)}% vendido
                    </p>
                    
                    <Link 
                      to={`/raffle/${raffle._id}`} 
                      className={`btn ${raffle.canPurchase ? 'btn-primary' : 'btn-disabled'}`}
                    >
                      {raffle.canPurchase ? 'Comprar Boletos' : 'Ver Detalles'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="how-it-works">
          <h2>¿Cómo Funciona?</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Selecciona tu Rifa</h3>
              <p>Elige el auto que quieres ganar y revisa todos los detalles.</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3>Compra tus Boletos</h3>
              <p>Regístrate y compra tus boletos digitales de forma segura.</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3>Espera el Sorteo</h3>
              <p>El ganador se determina con la Lotería Nacional de México.</p>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <h3>¡Recibe tu Premio!</h3>
              <p>Si ganas, te contactamos para entregarte tu auto nuevo.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;