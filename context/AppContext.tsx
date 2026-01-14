
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Appointment, Treatment, Notification, ClinicAvailability, PatientRecord, ToothState, ClinicSettings } from '../types';
import { INITIAL_TREATMENTS, DEFAULT_AVAILABILITY } from '../constants';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  treatments: Treatment[];
  setTreatments: React.Dispatch<React.SetStateAction<Treatment[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addNotification: (userId: string, title: string, message: string, type: Notification['type']) => void;
  clinicSettings: ClinicSettings;
  setClinicSettings: React.Dispatch<React.SetStateAction<ClinicSettings>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  patientRecords: PatientRecord[];
  setPatientRecords: React.Dispatch<React.SetStateAction<PatientRecord[]>>;
  updatePatientOdontogram: (patientId: string, odontogram: ToothState[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: ClinicSettings = {
  name: 'Deluxe Dental Care',
  phone: '+54 9 11 0000-0000',
  address: 'Av. Corrientes 1234, CABA',
  email: 'contacto@deluxedental.com',
  availability: DEFAULT_AVAILABILITY
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helpers para cargar datos de forma segura
  const getSaved = (key: string, fallback: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error(`Error loading ${key}`, e);
      return fallback;
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => getSaved('dental_user', null));
  const [allUsers, setAllUsers] = useState<User[]>(() => getSaved('dental_all_users', []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => getSaved('dental_appointments', []));
  const [treatments, setTreatments] = useState<Treatment[]>(() => getSaved('dental_treatments', INITIAL_TREATMENTS));
  const [notifications, setNotifications] = useState<Notification[]>(() => getSaved('dental_notifications', []));
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => getSaved('dental_clinic_settings', DEFAULT_SETTINGS));
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>(() => getSaved('dental_patient_records', []));
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Efectos de persistencia (Database Mock)
  useEffect(() => { localStorage.setItem('dental_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('dental_all_users', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('dental_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('dental_treatments', JSON.stringify(treatments)); }, [treatments]);
  useEffect(() => { localStorage.setItem('dental_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('dental_clinic_settings', JSON.stringify(clinicSettings)); }, [clinicSettings]);
  useEffect(() => { localStorage.setItem('dental_patient_records', JSON.stringify(patientRecords)); }, [patientRecords]);

  const addNotification = (userId: string, title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updatePatientOdontogram = (patientId: string, odontogram: ToothState[]) => {
    setPatientRecords(prev => {
      const existing = prev.find(r => r.patientId === patientId);
      if (existing) {
        return prev.map(r => r.patientId === patientId ? { ...r, odontogram, updatedAt: new Date().toISOString() } : r);
      } else {
        return [...prev, { patientId, odontogram, clinicalHistory: '', updatedAt: new Date().toISOString() }];
      }
    });
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      allUsers, setAllUsers,
      appointments, setAppointments,
      treatments, setTreatments,
      notifications, setNotifications, addNotification,
      clinicSettings, setClinicSettings,
      activeTab, setActiveTab,
      patientRecords, setPatientRecords,
      updatePatientOdontogram
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
