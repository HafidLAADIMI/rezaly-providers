  // services/serviceService.ts
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Service } from '../types';

class ServiceService {
  private readonly collectionName = 'services';
  
  // Cloudinary configuration
  private cloudName = 'doe1ikjh6'; // Replace with your Cloudinary cloud name
  private uploadPreset = 'rezlay-providers'; // Replace with your upload preset

  // Helper function to upload image to Cloudinary (fixed for unsigned upload)
  private async uploadServiceImage(serviceId: string, imageUri: string): Promise<string> {
    try {
      console.log('Starting Cloudinary upload for service:', serviceId);
      console.log('Image URI:', imageUri);

      // Create FormData for upload
      const formData = new FormData();
      
      // Add the image file
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `service-${serviceId}.jpg`,
      } as any);
      
      // Only allowed parameters for unsigned upload
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', 'services');
      formData.append('public_id', `service-${serviceId}-${Date.now()}`);
      // Removed 'quality' and 'format' - these should be configured in the upload preset

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const responseText = await response.text();
      console.log('Cloudinary response:', responseText);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('Cloudinary upload successful:', result.secure_url);

      return result.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(`Échec du téléchargement de l'image: ${error?.message}`);
    }
  }

  // Helper function to delete image (optional - Cloudinary doesn't require cleanup)
  private async deleteServiceImage(serviceId: string): Promise<void> {
    // With Cloudinary, we can optionally delete images or just overwrite them
    // For simplicity, we'll just log that we would delete
    console.log(`Would delete image for service: ${serviceId}`);
  }

  // Get services by salon ID
  async getServicesBySalon(salonId: string): Promise<Service[]> {
    try {
      console.log('Fetching services for salon:', salonId);
      
      const q = query(
        collection(db, this.collectionName),
        where('salonId', '==', salonId),
        where('isActive', '==', true),
        orderBy('price', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const services: Service[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const service = { 
          id: doc.id, 
          ...data,
          // Ensure image field exists (backward compatibility)
          image: data.image || null
        } as Service;
        
        console.log('Service loaded:', service.name, 'has image:', !!service.image);
        services.push(service);
      });

      console.log(`Loaded ${services.length} services, ${services.filter(s => s.image).length} with images`);
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
        const data = doc.data();
        services.push({ 
          id: doc.id, 
          ...data,
          image: data.image || null
        } as Service);
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
        const data = serviceSnap.data();
        return { 
          id: serviceSnap.id, 
          ...data,
          image: data.image || null
        } as Service;
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
        const data = doc.data();
        const service = { 
          id: doc.id, 
          ...data,
          image: data.image || null
        } as Service;
        
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
        const data = doc.data();
        services.push({ 
          id: doc.id, 
          ...data,
          image: data.image || null
        } as Service);
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
        const data = doc.data();
        services.push({ 
          id: doc.id, 
          ...data,
          image: data.image || null
        } as Service);
      });

      return services.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular services:', error);
      return [];
    }
  }

  // NEW: Add service with image support
  async addService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>, imageUri?: string): Promise<{ success: boolean; serviceId?: string; error?: string }> {
    try {
      // First create the service document
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...serviceData,
        image: null, // Will be updated if image is provided
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      let imageUrl = null;

      // If image is provided, upload it
      if (imageUri) {
        try {
          imageUrl = await this.uploadServiceImage(docRef.id, imageUri);
          
          // Update the service with the image URL
          await updateDoc(docRef, {
            image: imageUrl,
            updatedAt: serverTimestamp()
          });
        } catch (imageError) {
          console.error('Error uploading image, but service created:', imageError);
          // Service is still created even if image upload fails
        }
      }

      return { success: true, serviceId: docRef.id };
    } catch (error) {
      console.error('Error adding service:', error);
      return { success: false, error: 'Failed to create service' };
    }
  }

  // NEW: Update service with image support
  async updateService(serviceId: string, updates: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>, imageUri?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const serviceRef = doc(db, this.collectionName, serviceId);
      
      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // If new image is provided, upload it
      if (imageUri) {
        try {
          // Delete old image if it exists
          await this.deleteServiceImage(serviceId);
          
          // Upload new image
          const imageUrl = await this.uploadServiceImage(serviceId, imageUri);
          updateData.image = imageUrl;
        } catch (imageError) {
          console.error('Error updating image:', imageError);
          // Continue with other updates even if image fails
        }
      }

      await updateDoc(serviceRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating service:', error);
      return { success: false, error: 'Failed to update service' };
    }
  }

  // NEW: Delete service (including image)
  async deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete image from storage
      await this.deleteServiceImage(serviceId);
      
      // Delete service document
      const serviceRef = doc(db, this.collectionName, serviceId);
      await deleteDoc(serviceRef);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting service:', error);
      return { success: false, error: 'Failed to delete service' };
    }
  }
}

export const serviceService = new ServiceService();