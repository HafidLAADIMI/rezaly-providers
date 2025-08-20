// types/index.ts
export interface Salon {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  ownerId: string;
  categories: string[];
  cityId: string;
  services: Service[];
  rating: number;
  totalRatings: number;
  averagePrice: number;
  images: string[];
  operatingHours: OperatingHours;
  isActive: boolean;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
  distance?: number;
  trendingScore?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  categoryId: string;
  salonId: string;
  image?: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  salonId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: string[];
  appointmentDate: string;
  timeSlot: string;
  totalPrice: number;
  totalDuration: number;
  status: AppointmentStatus;
  notes?: string;
  salonNotes?: string;
  paymentMethod: 'cash' | 'card' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed';
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: any;
  updatedAt: any;
  confirmedAt?: any;
  rejectedAt?: any;
  completedAt?: any;
  cancelledAt?: any;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Review {
  id: string;
  salonId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  appointmentId: string;
  createdAt: any;
}
export interface Location {
  latitude: number;
  longitude: number;
}
export interface Address {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}
export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  salonsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'client' | 'salon_owner';
  avatar?: string;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SalonOwner extends User {
  salonId?: string;
  businessLicense?: string;
  idDocument?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationDocuments: string[];
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}