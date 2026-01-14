
export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  role: UserRole;
  createdAt: string;
}

export type AppointmentStatus = 'available' | 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface Treatment {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export interface Appointment {
  id: string;
  clientId?: string; // Optional if it's an available slot
  clientName?: string;
  treatmentId?: string; // Optional for generic slots
  date: string; // ISO string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  urgency?: UrgencyLevel;
  reason?: string;
  symptoms?: string[]; // New: Client reported symptoms
  improvements?: string[]; // New: Client desired improvements
  notes?: string;
  createdAt: string;
  isManualBooking?: boolean;
  paidAmount?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'status_change' | 'reminder' | 'system';
  read: boolean;
  createdAt: string;
}

export interface ClinicAvailability {
  days: number[]; // 0-6 (Sun-Sat)
  startHour: string; // HH:mm
  endHour: string; // HH:mm
  lunchStart?: string;
  lunchEnd?: string;
}
