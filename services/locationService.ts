// services/locationService.ts
import * as Location from 'expo-location';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Location as LocationType, Address, City } from '../types';

class LocationService {
  private currentLocation: LocationType | null = null;

  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<Address | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        return {
          street: address.street || undefined,
          city: address.city || undefined,
          region: address.region || undefined,
          country: address.country || undefined,
          postalCode: address.postalCode || undefined,
          formattedAddress: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }

  // Get coordinates from address (geocoding)
  async getCoordinatesFromAddress(address: string): Promise<LocationType | null> {
    try {
      const locations = await Location.geocodeAsync(address);
      
      if (locations.length > 0) {
        const location = locations[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      return null;
    }
  }

  // Get all cities from Firestore
  async getAllCities(): Promise<City[]> {
    try {
      const q = query(
        collection(db, 'cities'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const cities: City[] = [];
      querySnapshot.forEach((doc) => {
        cities.push({ id: doc.id, ...doc.data() } as City);
      });

      return cities;
    } catch (error) {
      console.error('Error getting cities:', error);
      return [];
    }
  }

  // Find nearest city
  async findNearestCity(userLat: number, userLng: number): Promise<City | null> {
    try {
      const cities = await this.getAllCities();
      let nearestCity: City | null = null;
      let shortestDistance = Infinity;

      cities.forEach(city => {
        if (city.latitude && city.longitude) {
          const distance = this.calculateDistance(
            userLat, userLng,
            city.latitude, city.longitude
          );
          
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestCity = city;
          }
        }
      });

      return nearestCity;
    } catch (error) {
      console.error('Error finding nearest city:', error);
      return null;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Watch location changes
  async watchLocation(callback: (location: LocationType) => void): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 100, // Update every 100 meters
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          };
          callback(this.currentLocation);
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();