export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface Raffle {
  _id: string;
  title: string;
  description: string;
  carDetails: {
    brand: string;
    model: string;
    year: number;
    color: string;
    features: string[];
    images: string[];
  };
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  availableTickets: number;
  drawDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  canPurchase?: boolean;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  raffle: Raffle;
  owner: User;
  purchasePrice: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'spei' | 'cash';
  isWinner: boolean;
  purchasedAt: string;
  verificationCode?: string;
}

export interface Winner {
  user: User;
  ticketNumber: string;
  winnerAnnouncedAt: string;
  lotteryResult: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}