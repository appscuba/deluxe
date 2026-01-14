
export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  photoUrl?: string;
  role: UserRole;
  createdAt: string;
}

export type AppointmentStatus = 'available' | 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high';

export type ToothCondition = 'healthy' | 'caries' | 'filling' | 'missing' | 'extraction' | 'implant' | 'endodontics';

export interface ToothState {
  id: number; // ISO/FDI numbering (e.g., 11-48)
  condition: ToothCondition;
  notes?: string;
}

export interface PatientRecord {
  patientId: string;
  odontogram: ToothState[];
  clinicalHistory: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export interface Appointment {
  id: string;
  clientId?: string;
  clientName?: string;
  treatmentId?: string;
  date: string; // ISO string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  urgency?: UrgencyLevel;
  reason?: string;
  symptoms?: string[];
  improvements?: string[];
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
