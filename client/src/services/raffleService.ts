import api from './api';
import { Raffle } from '../types';

export const raffleService = {
  async getPublicRaffles(): Promise<Raffle[]> {
    const response = await api.get('/raffles/public');
    return response.data;
  },

  async getRaffleById(id: string): Promise<Raffle> {
    const response = await api.get(`/raffles/public/${id}`);
    return response.data;
  },

  async getAllRaffles(params?: { 
    status?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<{ raffles: Raffle[]; total: number; totalPages: number }> {
    const response = await api.get('/raffles', { params });
    return response.data;
  },

  async createRaffle(raffleData: FormData): Promise<{ raffle: Raffle }> {
    const response = await api.post('/raffles', raffleData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateRaffle(id: string, raffleData: Partial<Raffle>): Promise<{ raffle: Raffle }> {
    const response = await api.put(`/raffles/${id}`, raffleData);
    return response.data;
  },

  async updateRaffleStatus(id: string, status: string): Promise<{ raffle: Raffle }> {
    const response = await api.patch(`/raffles/${id}/status`, { status });
    return response.data;
  },

  async getRaffleStats(id: string): Promise<any> {
    const response = await api.get(`/raffles/${id}/stats`);
    return response.data;
  }
};