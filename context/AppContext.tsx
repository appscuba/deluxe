
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

const STORAGE_KEYS = {
  USER: 'deluxe_current_user',
  ALL_USERS: 'deluxe_db_users',
  APPOINTMENTS: 'deluxe_db_appointments',
  TREATMENTS: 'deluxe_db_treatments',
  NOTIFICATIONS: 'deluxe_db_notifications',
  SETTINGS: 'deluxe_db_settings',
  RECORDS: 'deluxe_db_patient_records'
};

const DEFAULT_SETTINGS: ClinicSettings = {
  name: 'Deluxe Dental Care',
  phone: '+54 9 11 0000-0000',
  address: 'Av. Corrientes 1234, CABA',
  email: 'contacto@deluxedental.com',
  availability: DEFAULT_AVAILABILITY
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Función de carga segura
  const load = (key: string, fallback: any) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error("Error loading " + key, e);
      return fallback;
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => load(STORAGE_KEYS.USER, null));
  const [allUsers, setAllUsers] = useState<User[]>(() => load(STORAGE_KEYS.ALL_USERS, []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => load(STORAGE_KEYS.APPOINTMENTS, []));
  const [treatments, setTreatments] = useState<Treatment[]>(() => load(STORAGE_KEYS.TREATMENTS, INITIAL_TREATMENTS));
  const [notifications, setNotifications] = useState<Notification[]>(() => load(STORAGE_KEYS.NOTIFICATIONS, []));
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => load(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>(() => load(STORAGE_KEYS.RECORDS, []));
  const [activeTab, setActiveTab] = useState('Dashboard');

  // EFECTOS DE PERSISTENCIA INMEDIATA
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TREATMENTS, JSON.stringify(treatments)); }, [treatments]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(clinicSettings)); }, [clinicSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(patientRecords)); }, [patientRecords]);

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
