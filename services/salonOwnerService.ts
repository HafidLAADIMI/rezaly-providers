// services/salonOwnerService.ts
import { 
  doc, 
  updateDoc,
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Salon, Service, ServiceResponse, OperatingHours } from '../types';
import { serviceService } from './serviceService';

interface CreateSalonData {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  categories: string[];
  cityId: string;
  operatingHours: OperatingHours;
  images: string[];
}

interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: string;
  imageUri?: string; // Add image support
}

class SalonOwnerService {
  // Create salon profile
  async createSalon(ownerId: string, salonData: CreateSalonData): Promise<ServiceResponse<string>> {
    try {
      const salon = {
        ...salonData,
        ownerId,
        services: [],
        rating: 0,
        totalRatings: 0,
        averagePrice: 0,
        isActive: true,
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'salons'), salon);
      
      // Update user with salon ID
      await updateDoc(doc(db, 'users', ownerId), {
        salonId: docRef.id,
        updatedAt: serverTimestamp()
      });

      return { success: true, data: docRef.id };
    } catch (error: any) {
      console.error('Error creating salon:', error);
      return { success: false, error: error.message };
    }
  }

  // Update salon profile
  async updateSalon(salonId: string, updates: Partial<Salon>): Promise<ServiceResponse<void>> {
    try {
      await updateDoc(doc(db, 'salons', salonId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating salon:', error);
      return { success: false, error: error.message };
    }
  }

  // Add service to salon with image support
  async addService(salonId: string, serviceData: CreateServiceData): Promise<ServiceResponse<string>> {
    try {
      const { imageUri, ...restData } = serviceData;
      
      const newService = {
        ...restData,
        salonId,
        isActive: true
      };

      // Use the serviceService's addService method with image support
      const result = await serviceService.addService(newService, imageUri);
      
      if (result.success) {
        return { success: true, data: result.serviceId! };
      } else {
        return { success: false, error: result.error || 'Failed to add service' };
      }
    } catch (error: any) {
      console.error('Error in salonOwnerService.addService:', error);
      return { success: false, error: error.message };
    }
  }

  // Update service with image support
  async updateService(serviceId: string, updates: Partial<Service & { imageUri?: string }>): Promise<ServiceResponse<void>> {
    try {
      const { imageUri, ...restUpdates } = updates;
      
      // Use the serviceService's updateService method with image support
      const result = await serviceService.updateService(serviceId, restUpdates, imageUri);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to update service' };
      }
    } catch (error: any) {
      console.error('Error in salonOwnerService.updateService:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete service with image cleanup
  async deleteService(serviceId: string): Promise<ServiceResponse<void>> {
    try {
      // Use the serviceService's deleteService method (includes image cleanup)
      const result = await serviceService.deleteService(serviceId);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to delete service' };
      }
    } catch (error: any) {
      console.error('Error in salonOwnerService.deleteService:', error);
      return { success: false, error: error.message };
    }
  }

  // Get salon statistics
  async getSalonStats(salonId: string): Promise<ServiceResponse<any>> {
    try {
      // Get appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('salonId', '==', salonId)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      const stats = {
        totalAppointments: appointmentsSnapshot.size,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0,
        thisMonthRevenue: 0,
        averageRating: 0
      };

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data();
        
        // Count by status
        switch (appointment.status) {
          case 'pending':
            stats.pendingAppointments++;
            break;
          case 'confirmed':
            stats.confirmedAppointments++;
            break;
          case 'completed':
            stats.completedAppointments++;
            stats.totalRevenue += appointment.totalPrice;
            
            // Check if this month
            const appointmentDate = new Date(appointment.appointmentDate);
            if (appointmentDate.getMonth() === currentMonth && 
                appointmentDate.getFullYear() === currentYear) {
              stats.thisMonthRevenue += appointment.totalPrice;
            }
            break;
          case 'cancelled':
            stats.cancelledAppointments++;
            break;
        }
      });

      // Get reviews for average rating
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('salonId', '==', salonId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      if (reviewsSnapshot.size > 0) {
        let totalRating = 0;
        reviewsSnapshot.forEach((doc) => {
          totalRating += doc.data().rating;
        });
        stats.averageRating = totalRating / reviewsSnapshot.size;
      }

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Error getting salon stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Get monthly revenue data
  async getMonthlyRevenue(salonId: string, year: number): Promise<ServiceResponse<number[]>> {
    try {
      const monthlyRevenue = new Array(12).fill(0);
      
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('salonId', '==', salonId),
        where('status', '==', 'completed')
      );
      
      const snapshot = await getDocs(appointmentsQuery);
      
      snapshot.forEach((doc) => {
        const appointment = doc.data();
        const appointmentDate = new Date(appointment.appointmentDate);
        
        if (appointmentDate.getFullYear() === year) {
          const month = appointmentDate.getMonth();
          monthlyRevenue[month] += appointment.totalPrice;
        }
      });

      return { success: true, data: monthlyRevenue };
    } catch (error: any) {
      console.error('Error getting monthly revenue:', error);
      return { success: false, error: error.message };
    }
  }

  // Get recent reviews
  async getRecentReviews(salonId: string, limit: number = 10): Promise<ServiceResponse<any[]>> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('salonId', '==', salonId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(reviewsQuery);
      const reviews: any[] = [];
      
      snapshot.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: reviews.slice(0, limit) };
    } catch (error: any) {
      console.error('Error getting recent reviews:', error);
      return { success: false, error: error.message };
    }
  }
}

export const salonOwnerService = new SalonOwnerService();