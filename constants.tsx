
import { Treatment, ClinicAvailability } from './types';

export const INITIAL_TREATMENTS: Treatment[] = [
  { id: '1', name: 'Limpieza Dental', durationMinutes: 45, price: 50, description: 'Limpieza profunda y eliminación de sarro.' },
  { id: '2', name: 'Extracción', durationMinutes: 60, price: 80, description: 'Extracción dental simple o compleja.' },
  { id: '3', name: 'Ortodoncia (Control)', durationMinutes: 30, price: 40, description: 'Ajuste periódico de brackets.' },
  { id: '4', name: 'Blanqueamiento', durationMinutes: 90, price: 150, description: 'Tratamiento estético para aclarar el tono dental.' },
  { id: '5', name: 'Consulta General', durationMinutes: 30, price: 30, description: 'Evaluación inicial y diagnóstico.' },
];

export const DEFAULT_AVAILABILITY: ClinicAvailability = {
  days: [1, 2, 3, 4, 5], // Mon-Fri
  startHour: '09:00',
  endHour: '18:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
};

export const COLORS = {
  primary: '#0ea5e9', // sky-500
  secondary: '#64748b', // slate-500
  success: '#22c55e', // green-500
  danger: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
};
