// services/salonService.js
import { 
  doc, 
  getDoc, 
  getDocs,
  collection, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class SalonService {
  constructor() {
    this.collectionName = 'salons';
  }

  // Get all active salons with better location handling
  async getAllSalons(limitCount = 20, lastDoc = null) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('rating', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const salons = [];
      querySnapshot.forEach((doc) => {
        const salonData = { id: doc.id, ...doc.data() };
        // Ensure we have valid coordinates
        if (salonData.latitude && salonData.longitude && 
            typeof salonData.latitude === 'number' && 
            typeof salonData.longitude === 'number') {
          salons.push(salonData);
        }
      });

      return {
        salons,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error getting salons:', error);
      return { salons: [], lastDoc: null };
    }
  }

  // Get salon by ID
  async getSalonById(salonId) {
    try {
      const salonRef = doc(db, this.collectionName, salonId);
      const salonSnap = await getDoc(salonRef);
      
      if (salonSnap.exists()) {
        return { id: salonSnap.id, ...salonSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting salon:', error);
      return null;
    }
  }

  // Enhanced search salons by text with location priority
  async searchSalons(searchText, userLocation = null) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('name')
      );

      const querySnapshot = await getDocs(q);
      const salons = [];
      
      querySnapshot.forEach((doc) => {
        const salon = { id: doc.id, ...doc.data() };
        
        // Check if salon has valid coordinates
        if (!salon.latitude || !salon.longitude) return;
        
        // Text matching
        const matchesText = 
          salon.name.toLowerCase().includes(searchText.toLowerCase()) ||
          salon.description.toLowerCase().includes(searchText.toLowerCase()) ||
          salon.address.toLowerCase().includes(searchText.toLowerCase()) ||
          (salon.services && salon.services.some(service => 
            service.name.toLowerCase().includes(searchText.toLowerCase())
          ));

        if (matchesText) {
          // Add distance if user location is available
          if (userLocation) {
            salon.distance = this.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              salon.latitude,
              salon.longitude
            );
          }
          salons.push(salon);
        }
      });

      // Sort by distance if available, otherwise by rating
      if (userLocation) {
        salons.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else {
        salons.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      return salons;
    } catch (error) {
      console.error('Error searching salons:', error);
      return [];
    }
  }

  // Get salons within radius with advanced filtering
  async getSalonsInRadius(centerLat, centerLng, radiusKm = 10, filters = {}) {
    try {
      const allSalons = await this.getAllSalons(500); // Get more salons for better filtering
      
      let salonsInRadius = allSalons.salons.filter(salon => {
        if (!salon.latitude || !salon.longitude) return false;
        
        const distance = this.calculateDistance(
          centerLat, centerLng, 
          salon.latitude, salon.longitude
        );
        
        return distance <= radiusKm;
      });

      // Apply additional filters
      if (filters.categoryId) {
        salonsInRadius = salonsInRadius.filter(salon => 
          salon.categories && salon.categories.includes(filters.categoryId)
        );
      }

      if (filters.minRating) {
        salonsInRadius = salonsInRadius.filter(salon => 
          (salon.rating || 0) >= filters.minRating
        );
      }

      if (filters.priceRange) {
        // Implement price filtering based on your price structure
        salonsInRadius = salonsInRadius.filter(salon => {
          // Example: filter by average service price
          return true; // Placeholder
        });
      }

      // Add distance to each salon and sort
      salonsInRadius = salonsInRadius.map(salon => ({
        ...salon,
        distance: this.calculateDistance(centerLat, centerLng, salon.latitude, salon.longitude)
      }));

      // Sort by selected criteria
      switch (filters.sortBy) {
        case 'distance':
          salonsInRadius.sort((a, b) => a.distance - b.distance);
          break;
        case 'rating':
          salonsInRadius.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'name':
          salonsInRadius.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          salonsInRadius.sort((a, b) => a.distance - b.distance);
      }

      return salonsInRadius;
    } catch (error) {
      console.error('Error getting salons in radius:', error);
      return [];
    }
  }

  // Get nearby salons (wrapper for backward compatibility)
  async getNearbySalons(userLat, userLng, radiusKm = 10) {
    return this.getSalonsInRadius(userLat, userLng, radiusKm);
  }

  // Search salons by city
  async getSalonsByCity(cityId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('cityId', '==', cityId),
        where('isActive', '==', true),
        orderBy('rating', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const salons = [];
      querySnapshot.forEach((doc) => {
        const salonData = { id: doc.id, ...doc.data() };
        if (salonData.latitude && salonData.longitude) {
          salons.push(salonData);
        }
      });

      return salons;
    } catch (error) {
      console.error('Error getting salons by city:', error);
      return [];
    }
  }

  // Search salons by category
  async getSalonsByCategory(categoryId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('categories', 'array-contains', categoryId),
        where('isActive', '==', true),
        orderBy('rating', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const salons = [];
      querySnapshot.forEach((doc) => {
        const salonData = { id: doc.id, ...doc.data() };
        if (salonData.latitude && salonData.longitude) {
          salons.push(salonData);
        }
      });

      return salons;
    } catch (error) {
      console.error('Error getting salons by category:', error);
      return [];
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Format distance for display
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${(distanceKm * 1000).toFixed(0)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  // Get popular salons with location context
  async getPopularSalons(userLocation = null, limitCount = 10) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('totalRatings', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const salons = [];
      
      querySnapshot.forEach((doc) => {
        const salon = { id: doc.id, ...doc.data() };
        if (salon.latitude && salon.longitude) {
          if (userLocation) {
            salon.distance = this.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              salon.latitude,
              salon.longitude
            );
          }
          salons.push(salon);
        }
      });

      return salons;
    } catch (error) {
      console.error('Error getting popular salons:', error);
      return [];
    }
  }

  // Advanced filter salons
  async filterSalons(filters) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true)
      );

      // Add basic Firestore filters
      if (filters.cityId) {
        q = query(q, where('cityId', '==', filters.cityId));
      }

      if (filters.categoryId) {
        q = query(q, where('categories', 'array-contains', filters.categoryId));
      }

      // Apply sorting
      if (filters.sortBy === 'rating') {
        q = query(q, orderBy('rating', 'desc'));
      } else if (filters.sortBy === 'name') {
        q = query(q, orderBy('name', 'asc'));
      } else {
        q = query(q, orderBy('rating', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      let salons = [];
      
      querySnapshot.forEach((doc) => {
        const salon = { id: doc.id, ...doc.data() };
        if (salon.latitude && salon.longitude) {
          salons.push(salon);
        }
      });

      // Apply client-side filters
      if (filters.minRating) {
        salons = salons.filter(salon => (salon.rating || 0) >= filters.minRating);
      }

      if (filters.maxDistance && filters.userLocation) {
        salons = salons.filter(salon => {
          const distance = this.calculateDistance(
            filters.userLocation.latitude,
            filters.userLocation.longitude,
            salon.latitude,
            salon.longitude
          );
          return distance <= filters.maxDistance;
        });
      }

      // Add distance information if user location is provided
      if (filters.userLocation) {
        salons = salons.map(salon => ({
          ...salon,
          distance: this.calculateDistance(
            filters.userLocation.latitude,
            filters.userLocation.longitude,
            salon.latitude,
            salon.longitude
          )
        }));

        // Re-sort by distance if that's the selected sort
        if (filters.sortBy === 'distance') {
          salons.sort((a, b) => a.distance - b.distance);
        }
      }

      return salons;
    } catch (error) {
      console.error('Error filtering salons:', error);
      return [];
    }
  }

  // Get salon availability for quick booking
  async getSalonAvailability(salonId, date) {
    try {
      // This would integrate with your booking system
      // Placeholder implementation
      return {
        available: true,
        timeSlots: [
          '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
        ]
      };
    } catch (error) {
      console.error('Error getting salon availability:', error);
      return { available: false, timeSlots: [] };
    }
  }

  // Get salon services with pricing
  async getSalonServices(salonId) {
    try {
      const salon = await this.getSalonById(salonId);
      return salon?.services || [];
    } catch (error) {
      console.error('Error getting salon services:', error);
      return [];
    }
  }

  // Search salons by multiple criteria
  async advancedSearch(searchCriteria) {
    try {
      const {
        text,
        location,
        radius = 10,
        category,
        minRating,
        priceRange,
        sortBy = 'distance'
      } = searchCriteria;

      let salons = [];

      if (text) {
        // Text-based search
        salons = await this.searchSalons(text, location);
      } else {
        // Location-based search
        if (location) {
          salons = await this.getSalonsInRadius(
            location.latitude,
            location.longitude,
            radius,
            { categoryId: category, minRating, sortBy }
          );
        } else {
          // Fallback to all salons
          const result = await this.getAllSalons(200);
          salons = result.salons;
        }
      }

      // Apply additional filters
      if (category && !text) {
        salons = salons.filter(salon => 
          salon.categories && salon.categories.includes(category)
        );
      }

      if (minRating) {
        salons = salons.filter(salon => (salon.rating || 0) >= minRating);
      }

      if (priceRange) {
        // Implement price range filtering based on your pricing structure
        salons = salons.filter(salon => {
          // Example implementation - adjust based on your data structure
          const avgPrice = salon.averagePrice || 0;
          return avgPrice >= priceRange.min && avgPrice <= priceRange.max;
        });
      }

      return salons;
    } catch (error) {
      console.error('Error in advanced search:', error);
      return [];
    }
  }

  // Get trending salons based on recent bookings
  async getTrendingSalons(userLocation = null, limitCount = 10) {
    try {
      // This would typically involve recent booking data
      // For now, using a combination of rating and total ratings
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('rating', 'desc'),
        limit(limitCount * 2) // Get more to filter and sort
      );

      const querySnapshot = await getDocs(q);
      const salons = [];
      
      querySnapshot.forEach((doc) => {
        const salon = { id: doc.id, ...doc.data() };
        if (salon.latitude && salon.longitude) {
          // Calculate trending score (you can adjust this formula)
          salon.trendingScore = (salon.rating || 0) * Math.log(salon.totalRatings || 1);
          
          if (userLocation) {
            salon.distance = this.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              salon.latitude,
              salon.longitude
            );
          }
          salons.push(salon);
        }
      });

      // Sort by trending score and limit results
      salons.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
      return salons.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting trending salons:', error);
      return [];
    }
  }

  // Utility method to get map bounds for a list of salons
  getMapBounds(salons) {
    if (salons.length === 0) return null;

    let minLat = salons[0].latitude;
    let maxLat = salons[0].latitude;
    let minLng = salons[0].longitude;
    let maxLng = salons[0].longitude;

    salons.forEach(salon => {
      if (salon.latitude < minLat) minLat = salon.latitude;
      if (salon.latitude > maxLat) maxLat = salon.latitude;
      if (salon.longitude < minLng) minLng = salon.longitude;
      if (salon.longitude > maxLng) maxLng = salon.longitude;
    });

    // Add some padding
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) + latPadding,
      longitudeDelta: (maxLng - minLng) + lngPadding,
    };
  }
}

export const salonService = new SalonService();