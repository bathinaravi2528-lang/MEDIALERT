import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  register: (newUser: Omit<User, 'id'> & { password?: string }) => { success: boolean; message: string };
  resetPassword: (usernameOrEmail: string, newPassword: string) => { success: boolean; message: string };
}

interface RegisteredUser extends User {
  password?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'u1',
  username: 'MedUser',
  name: 'Demo User',
  email: 'demo@medicycle.vizag',
  mobile: '+91 98765 43210',
  address: 'Flat 4B, Sri Ram Apartments, MVP Colony',
  location: 'MVP Colony',
  avatar: '',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    const stored = localStorage.getItem('medicycle_users');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse registered users', e);
      }
    }
    return [];
  });

  const [demoPassword, setDemoPassword] = useState<string>(() => {
    return localStorage.getItem('medicycle_demo_password') || '123456';
  });

  const login = (username: string, password: string): boolean => {
    if (username.toLowerCase() === 'meduser' && password === demoPassword) {
      setUser(DEMO_USER);
      return true;
    }
    
    const matched = registeredUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (matched) {
      const { password: _, ...userWithoutPassword } = matched;
      setUser(userWithoutPassword);
      return true;
    }
    
    return false;
  };

  const resetPassword = (usernameOrEmail: string, newPassword: string): { success: boolean; message: string } => {
    const term = usernameOrEmail.toLowerCase();
    
    // Check if it's the demo user
    if (term === 'meduser' || term === DEMO_USER.email.toLowerCase()) {
      setDemoPassword(newPassword);
      localStorage.setItem('medicycle_demo_password', newPassword);
      return { success: true, message: 'Password reset successful for Demo User!' };
    }

    // Find in registered users
    const index = registeredUsers.findIndex(
      u => u.username.toLowerCase() === term || u.email.toLowerCase() === term
    );
    
    if (index !== -1) {
      const updatedList = [...registeredUsers];
      updatedList[index] = { ...updatedList[index], password: newPassword };
      setRegisteredUsers(updatedList);
      localStorage.setItem('medicycle_users', JSON.stringify(updatedList));
      return { success: true, message: 'Password reset successful!' };
    }

    return { success: false, message: 'User not found with that username or email.' };
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
      
      if (user.id !== 'u1') {
        const updatedList = registeredUsers.map(u => 
          u.id === user.id ? { ...u, ...updates } : u
        );
        setRegisteredUsers(updatedList);
        localStorage.setItem('medicycle_users', JSON.stringify(updatedList));
      }
    }
  };

  const register = (newUser: Omit<User, 'id'> & { password?: string }): { success: boolean; message: string } => {
    const usernameLower = newUser.username.toLowerCase();
    
    if (usernameLower === 'meduser') {
      return { success: false, message: 'Username is already taken.' };
    }

    const exists = registeredUsers.some(u => u.username.toLowerCase() === usernameLower);
    if (exists) {
      return { success: false, message: 'Username is already taken.' };
    }

    const createdUser: RegisteredUser = {
      ...newUser,
      id: 'u_' + Date.now(),
    };

    const updatedList = [...registeredUsers, createdUser];
    setRegisteredUsers(updatedList);
    localStorage.setItem('medicycle_users', JSON.stringify(updatedList));
    return { success: true, message: 'Registration successful!' };
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser, register, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
