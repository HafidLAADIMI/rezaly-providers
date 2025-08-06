// services/serviceService.ts
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Service } from '../types';

class ServiceService {
  private readonly collectionName = 'services';

  // Get services by salon ID
  async getServicesBySalon(salonId: string): Promise<Service[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('salonId', '==', salonId),
        where('isActive', '==', true),
        orderBy('price', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() } as Service);
      });

      return services;
    } catch (error) {
      console.error('Error getting services by salon:', error);
      return [];
    }
  }

  // Get services by category
  async getServicesByCategory(categoryId: string): Promise<Service[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('categoryId', '==', categoryId),
        where('isActive', '==', true),
        orderBy('price', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() } as Service);
      });

      return services;
    } catch (error) {
      console.error('Error getting services by category:', error);
      return [];
    }
  }

  // Get service by ID
  async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      const serviceRef = doc(db, this.collectionName, serviceId);
      const serviceSnap = await getDoc(serviceRef);
      
      if (serviceSnap.exists()) {
        return { id: serviceSnap.id, ...serviceSnap.data() } as Service;
      }
      return null;
    } catch (error) {
      console.error('Error getting service:', error);
      return null;
    }
  }

  // Get multiple services by IDs
  async getServicesByIds(serviceIds: string[]): Promise<Service[]> {
    try {
      const services: Service[] = [];
      
      // Use Promise.all for better performance
      const servicePromises = serviceIds.map(serviceId => this.getServiceById(serviceId));
      const results = await Promise.all(servicePromises);
      
      results.forEach(service => {
        if (service) {
          services.push(service);
        }
      });

      return services;
    } catch (error) {
      console.error('Error getting services by IDs:', error);
      return [];
    }
  }

  // Search services
  async searchServices(searchText: string, filters: { categoryId?: string; salonId?: string } = {}): Promise<Service[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true)
      );

      // Apply filters
      if (filters.categoryId) {
        q = query(q, where('categoryId', '==', filters.categoryId));
      }

      if (filters.salonId) {
        q = query(q, where('salonId', '==', filters.salonId));
      }

      // Add ordering
      q = query(q, orderBy('name', 'asc'));

      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      
      querySnapshot.forEach((doc) => {
        const service = { id: doc.id, ...doc.data() } as Service;
        if (!searchText || 
            service.name.toLowerCase().includes(searchText.toLowerCase()) ||
            service.description.toLowerCase().includes(searchText.toLowerCase())) {
          services.push(service);
        }
      });

      return services;
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  }

  // Get all services (with pagination)
  async getAllServices(limit: number = 50): Promise<Service[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      
      querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() } as Service);
      });

      return services.slice(0, limit);
    } catch (error) {
      console.error('Error getting all services:', error);
      return [];
    }
  }

  // Get popular services (most booked)
  async getPopularServices(limit: number = 10): Promise<Service[]> {
    try {
      // Since we don't have booking count in the schema, we'll return by price/rating
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('price', 'desc') // Assuming higher price = more popular
      );

      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      
      querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() } as Service);
      });

      return services.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular services:', error);
      return [];
    }
  }
}

export const serviceService = new ServiceService();