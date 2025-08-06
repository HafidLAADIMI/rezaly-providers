  // services/appointmentService.ts
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  collection, 
  query, 
  where, 
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Appointment, AppointmentStatus, ServiceResponse } from '../types';

interface CreateAppointmentData {
  salonId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: string[];
  appointmentDate: string;
  timeSlot: string;
  totalPrice: number;
  totalDuration: number;
  notes?: string;
  paymentMethod: 'cash' | 'card' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface UpdateAppointmentData {
  salonNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  [key: string]: any;
}

class AppointmentService {
  private readonly collectionName = 'appointments';

  // Create new appointment
  async createAppointment(appointmentData: CreateAppointmentData): Promise<ServiceResponse<string>> {
    try {
      const appointment = {
        ...appointmentData,
        status: 'pending' as AppointmentStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), appointment);
      return { success: true, data: docRef.id };
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const appointmentRef = doc(db, this.collectionName, appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      
      if (appointmentSnap.exists()) {
        return { id: appointmentSnap.id, ...appointmentSnap.data() } as Appointment;
      }
      return null;
    } catch (error) {
      console.error('Error getting appointment:', error);
      return null;
    }
  }

  // Get client appointments
  async getClientAppointments(clientId: string): Promise<Appointment[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('clientId', '==', clientId),
        orderBy('appointmentDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
      });

      return appointments;
    } catch (error) {
      console.error('Error getting client appointments:', error);
      return [];
    }
  }

  // Get salon appointments
  async getSalonAppointments(salonId: string, status?: AppointmentStatus): Promise<Appointment[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('salonId', '==', salonId),
        orderBy('appointmentDate', 'asc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
      });

      return appointments;
    } catch (error) {
      console.error('Error getting salon appointments:', error);
      return [];
    }
  }

  // Update appointment status
  async updateAppointmentStatus(
    appointmentId: string, 
    status: AppointmentStatus, 
    additionalData: UpdateAppointmentData = {}
  ): Promise<ServiceResponse<void>> {
    try {
      const appointmentRef = doc(db, this.collectionName, appointmentId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };

      // Add status-specific timestamps
      if (status === 'confirmed') {
        updateData.confirmedAt = serverTimestamp();
      } else if (status === 'rejected') {
        updateData.rejectedAt = serverTimestamp();
      } else if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
      }

      await updateDoc(appointmentRef, updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId: string, cancellationReason: string): Promise<ServiceResponse<void>> {
    try {
      return await this.updateAppointmentStatus(
        appointmentId, 
        'cancelled',
        { cancellationReason }
      );
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Confirm appointment
  async confirmAppointment(appointmentId: string, salonNotes: string = ''): Promise<ServiceResponse<void>> {
    try {
      return await this.updateAppointmentStatus(
        appointmentId,
        'confirmed',
        { salonNotes }
      );
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject appointment
  async rejectAppointment(appointmentId: string, rejectionReason: string): Promise<ServiceResponse<void>> {
    try {
      return await this.updateAppointmentStatus(
        appointmentId,
        'rejected',
        { rejectionReason }
      );
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get available time slots for a salon on a specific date
  async getAvailableTimeSlots(salonId: string, date: string): Promise<string[]> {
    try {
      // Get salon info to check operating hours
      const salonRef = doc(db, 'salons', salonId);
      const salonSnap = await getDoc(salonRef);
      
      if (!salonSnap.exists()) {
        throw new Error('Salon not found');
      }

      const salon = salonSnap.data();
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
      const operatingHours = salon.operatingHours?.[dayOfWeek];

      if (!operatingHours || operatingHours.isClosed) {
        return [];
      }

      // Get existing appointments for the date
      const q = query(
        collection(db, this.collectionName),
        where('salonId', '==', salonId),
        where('appointmentDate', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      );

      const querySnapshot = await getDocs(q);
      const bookedSlots: string[] = [];
      querySnapshot.forEach((doc) => {
        const appointment = doc.data();
        bookedSlots.push(appointment.timeSlot);
      });

      // Generate available time slots
      const availableSlots = this.generateTimeSlots(
        operatingHours.open,
        operatingHours.close,
        bookedSlots
      );

      return availableSlots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return [];
    }
  }

  // Generate time slots between open and close hours
  private generateTimeSlots(openTime: string, closeTime: string, bookedSlots: string[] = [], interval: number = 30): string[] {
    const slots: string[] = [];
    const start = this.timeToMinutes(openTime);
    const end = this.timeToMinutes(closeTime);

    for (let time = start; time < end; time += interval) {
      const timeSlot = this.minutesToTime(time);
      if (!bookedSlots.includes(timeSlot)) {
        slots.push(timeSlot);
      }
    }

    return slots;
  }

  // Helper function to convert time string to minutes
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper function to convert minutes to time string
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Get appointment history for client
  async getAppointmentHistory(clientId: string): Promise<Appointment[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('clientId', '==', clientId),
        where('status', '==', 'completed'),
        orderBy('appointmentDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const history: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as Appointment);
      });

      return history;
    } catch (error) {
      console.error('Error getting appointment history:', error);
      return [];
    }
  }
}

export const appointmentService = new AppointmentService();