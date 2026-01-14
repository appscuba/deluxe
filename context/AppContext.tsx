
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Appointment, Treatment, Notification, ClinicAvailability } from '../types';
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
  addNotification: (userId: string, title: string, message: string, type: Notification['type']) => void;
  availability: ClinicAvailability;
  setAvailability: React.Dispatch<React.SetStateAction<ClinicAvailability>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dental_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('dental_all_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('dental_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [treatments, setTreatments] = useState<Treatment[]>(() => {
    const saved = localStorage.getItem('dental_treatments');
    return saved ? JSON.parse(saved) : INITIAL_TREATMENTS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('dental_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [availability, setAvailability] = useState<ClinicAvailability>(() => {
    const saved = localStorage.getItem('dental_availability');
    return saved ? JSON.parse(saved) : DEFAULT_AVAILABILITY;
  });

  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    localStorage.setItem('dental_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('dental_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('dental_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('dental_treatments', JSON.stringify(treatments));
  }, [treatments]);

  useEffect(() => {
    localStorage.setItem('dental_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('dental_availability', JSON.stringify(availability));
  }, [availability]);

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

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      allUsers, setAllUsers,
      appointments, setAppointments,
      treatments, setTreatments,
      notifications, addNotification,
      availability, setAvailability,
      activeTab, setActiveTab
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
