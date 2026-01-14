
import { Appointment, Treatment, ClinicAvailability } from '../types';

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const addMinutes = (timeStr: string, minutes: number): string => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return formatTime(date);
};

/**
 * Verifica si faltan al menos 48 horas para la cita
 */
export const canPatientManageAppointment = (date: string, startTime: string): boolean => {
  const appointmentDate = new Date(`${date}T${startTime}`);
  const now = new Date();
  const diffInMs = appointmentDate.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  return diffInHours >= 48;
};

export const isTimeSlotAvailable = (
  date: string,
  startTime: string,
  endTime: string,
  existingAppointments: Appointment[],
  excludeId?: string
): boolean => {
  return !existingAppointments.some(app => {
    if (app.id === excludeId) return false;
    if (app.date !== date) return false;
    if (app.status === 'cancelled' || app.status === 'rejected') return false;

    const start = startTime;
    const end = endTime;
    const appStart = app.startTime;
    const appEnd = app.endTime;

    return (start < appEnd) && (end > appStart);
  });
};

export const generateAvailableSlots = (
  date: string,
  treatment: Treatment,
  availability: ClinicAvailability,
  appointments: Appointment[]
): string[] => {
  const slots: string[] = [];
  const duration = treatment.durationMinutes;
  
  let current = availability.startHour;
  const endLimit = availability.endHour;

  while (current < endLimit) {
    const nextSlotEnd = addMinutes(current, duration);
    if (nextSlotEnd > endLimit) break;

    const isLunch = availability.lunchStart && availability.lunchEnd && 
                    (current < availability.lunchEnd && nextSlotEnd > availability.lunchStart);

    if (!isLunch && isTimeSlotAvailable(date, current, nextSlotEnd, appointments)) {
      slots.push(current);
    }
    current = addMinutes(current, 15);
  }

  return slots;
};
