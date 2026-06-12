export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  location: string;
  avatar?: string;
}

export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  quantity: number;
  expiryDate: string;
  condition: 'Sealed' | 'Opened' | 'Good' | 'Fair';
  location: string;
  type: 'exchange' | 'donate' | 'sell';
  price?: number;
  category: string;
  daysLeft: number;
  status: 'safe' | 'expiring' | 'urgent';
  listedBy: string;
  description?: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  location: string;
  rating: number;
  beds: number;
  emergency: boolean;
  coordinates: { lat: number; lng: number };
}

export interface Order {
  id: string;
  medicineId: string;
  medicineName: string;
  status: 'confirmed' | 'verified' | 'dispatched' | 'delivered';
  estimatedDelivery: string;
  address: string;
  amount: number;
  date: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
  transactionId: string;
  date: string;
  description: string;
}

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

export interface Notification {
  id: string;
  recipientName: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}
