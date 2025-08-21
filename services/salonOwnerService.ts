// services/salonOwnerService.ts - UPDATED FOR SINGLE COVER IMAGE
import { 
  doc, 
  updateDoc,
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  getDoc
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
  coverImage?: string; // CHANGED: Single cover image instead of array
  imageUrl?: string;   // ALTERNATIVE: Direct imageUrl field
}

interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: string;
  imageUri?: string;
}

class SalonOwnerService {
  private cloudName = 'doe1ikjh6';
  private uploadPreset = 'rezlay-providers';

  // Upload single image to Cloudinary
  private async uploadImageToCloudinary(imageUri: string): Promise<string | null> {
    try {
      console.log('Uploading image to Cloudinary:', imageUri);
      
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `salon_cover_${Date.now()}.jpg`
      } as any);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('cloud_name', this.cloudName);

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

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully uploaded to Cloudinary:', data.secure_url);
        return data.secure_url;
      } else {
        console.error('Cloudinary upload failed:', response.status, await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return null;
    }
  }

  // Get user's salons with better error handling for indexes
  async getUserSalons(ownerId: string): Promise<Salon[]> {
    try {
      // Try the indexed query first (with orderBy)
      try {
        const salonsQuery = query(
          collection(db, 'salons'),
          where('ownerId', '==', ownerId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(salonsQuery);
        const salons: Salon[] = [];
        
        snapshot.forEach((doc) => {
          salons.push({ id: doc.id, ...doc.data() } as Salon);
        });

        return salons;
      } catch (indexError: any) {
        console.warn('Firestore index not ready, falling back to simple query:', indexError.message);
        
        // Fallback to simple query without orderBy
        const simpleSalonsQuery = query(
          collection(db, 'salons'),
          where('ownerId', '==', ownerId)
        );
        
        const snapshot = await getDocs(simpleSalonsQuery);
        const salons: Salon[] = [];
        
        snapshot.forEach((doc) => {
          salons.push({ id: doc.id, ...doc.data() } as Salon);
        });

        // Sort manually by createdAt if available
        salons.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });

        return salons;
      }
    } catch (error) {
      console.error('Error getting user salons:', error);
      return [];
    }
  }

  // Check if user has a verified salon
  async getUserVerifiedSalon(ownerId: string): Promise<Salon | null> {
    try {
      const salons = await this.getUserSalons(ownerId);
      const verifiedSalon = salons.find(salon => salon.isVerified === true);
      return verifiedSalon || null;
    } catch (error) {
      console.error('Error getting verified salon:', error);
      return null;
    }
  }

  // Get user account status
  async getUserAccountStatus(ownerId: string): Promise<{
    hasAccount: boolean;
    isVerified: boolean;
    hasSalon: boolean;
    salon?: Salon;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
  }> {
    try {
      // Check user document
      const userDoc = await getDoc(doc(db, 'users', ownerId));
      if (!userDoc.exists()) {
        return { hasAccount: false, isVerified: false, hasSalon: false };
      }

      const userData = userDoc.data();
      const accountVerified = userData.isVerified || false;

      // Check for salons
      const salons = await this.getUserSalons(ownerId);
      
      if (salons.length === 0) {
        return {
          hasAccount: true,
          isVerified: accountVerified,
          hasSalon: false,
          verificationStatus: accountVerified ? 'verified' : 'pending'
        };
      }

      const latestSalon = salons[0];
      const salonVerified = latestSalon.isVerified || false;

      return {
        hasAccount: true,
        isVerified: accountVerified && salonVerified,
        hasSalon: true,
        salon: latestSalon,
        verificationStatus: salonVerified ? 'verified' : 'pending'
      };
    } catch (error) {
      console.error('Error getting user account status:', error);
      return { hasAccount: false, isVerified: false, hasSalon: false };
    }
  }

  // UPDATED: Create salon profile with single cover image
  async createSalon(ownerId: string, salonData: CreateSalonData): Promise<ServiceResponse<string>> {
    try {
      let imageUrl: string | null = null;
      
      // Handle single cover image upload
      if (salonData.coverImage) {
        console.log('Uploading cover image to Cloudinary...');
        imageUrl = await this.uploadImageToCloudinary(salonData.coverImage);
        
        if (!imageUrl) {
          return { 
            success: false, 
            error: 'Échec du téléchargement de l\'image. Veuillez réessayer.' 
          };
        }
        console.log('Cover image uploaded successfully:', imageUrl);
      } else if (salonData.imageUrl) {
        // If imageUrl is provided directly (already uploaded)
        imageUrl = salonData.imageUrl;
      }

      // Create salon document with image URL
      const salon = {
        name: salonData.name,
        description: salonData.description,
        address: salonData.address,
        latitude: salonData.latitude,
        longitude: salonData.longitude,
        phone: salonData.phone,
        email: salonData.email,
        categories: salonData.categories,
        cityId: salonData.cityId,
        operatingHours: salonData.operatingHours,
        imageUrl: imageUrl, // CHANGED: Single image URL instead of array
        contactInfo: {
          phone: salonData.phone,
          email: salonData.email
        },
        ownerId,
        services: [],
        rating: 0,
        totalRatings: 0,
        averagePrice: 0,
        isActive: false, // Inactive until verified
        isVerified: false, // Needs admin verification
        verificationStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'salons'), salon);
      
      // Update user with salon ID and mark as pending verification
      await updateDoc(doc(db, 'users', ownerId), {
        salonId: docRef.id,
        hasPendingSalon: true,
        updatedAt: serverTimestamp()
      });

      console.log('Salon created successfully with ID:', docRef.id);
      return { success: true, data: docRef.id };
    } catch (error: any) {
      console.error('Error creating salon:', error);
      return { success: false, error: error.message };
    }
  }

  // UPDATED: Update salon profile with single image support
  async updateSalon(salonId: string, updates: Partial<Salon & { coverImage?: string }>): Promise<ServiceResponse<void>> {
    try {
      const updateData: any = { ...updates };
      
      // Handle cover image update
      if (updates.coverImage) {
        const newImageUrl = await this.uploadImageToCloudinary(updates.coverImage);
        if (newImageUrl) {
          updateData.imageUrl = newImageUrl;
        } else {
          return { success: false, error: 'Échec du téléchargement de l\'image' };
        }
        // Remove the coverImage field as it's not stored in Firestore
        delete updateData.coverImage;
      }

      await updateDoc(doc(db, 'salons', salonId), {
        ...updateData,
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
        collection(db, 'apartments'),
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