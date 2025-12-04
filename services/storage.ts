import { User, UserRole, WorkRecord } from '../types';

// Bumped version to clear old seeded users from localStorage
const USERS_KEY = 'pt_users_v2';
const RECORDS_KEY = 'pt_records_v2';

// Admin credentials (In a real app, these are on the server, never in client code)
const ADMIN_HASH = 'EVRI01'; 
const ADMIN_USER = 'admin';

// Helper for generating IDs safely (prevents white screen on non-secure contexts)
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if randomUUID fails
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Initial Seed Data
const seedUsers = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    // Only Admin seeded now. "João Silva" and "Maria Santos" removed as requested.
    const admin: User = { 
      id: 'admin-1', 
      username: 'admin', 
      password: ADMIN_HASH, 
      name: 'Administrador', 
      role: UserRole.ADMIN 
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([admin]));
  }
};

seedUsers();

export const StorageService = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },

  getUserByUsername: (username: string): User | undefined => {
    const users = StorageService.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  authenticate: (username: string, passwordInput: string): { success: boolean; user?: User; message?: string } => {
    const users = StorageService.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (user.role === UserRole.ADMIN) {
      if (passwordInput === ADMIN_HASH) {
        return { success: true, user };
      } else {
        return { success: false, message: 'Credenciais de administrador inválidas.' };
      }
    }

    if (user.password === passwordInput) {
       return { success: true, user };
    }

    return { success: false, message: 'Senha incorreta.' };
  },

  registerUser: (name: string, username: string, password: string): { success: boolean; user?: User; message?: string } => {
    const users = StorageService.getUsers();
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Este nome de usuário já existe.' };
    }

    const newUser: User = {
      id: generateUUID(),
      name,
      username,
      password,
      role: UserRole.USER
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return { success: true, user: newUser };
  },

  getAllRecords: (): WorkRecord[] => {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
  },

  getRecordsByUser: (userId: string): WorkRecord[] => {
    const all = StorageService.getAllRecords();
    return all.filter(r => r.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addRecord: (record: WorkRecord): void => {
    const all = StorageService.getAllRecords();
    all.push(record);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
  },

  deleteRecord: (recordId: string): void => {
    const all = StorageService.getAllRecords();
    const filtered = all.filter(r => r.id !== recordId);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
  },

  exportToCSV: (records: WorkRecord[]): string => {
    const headers = ['Data', 'Usuario', 'Modo', 'ID Rota', 'Qtd', 'Valor (£)', 'Criado Em'];
    const rows = records.map(r => [
      r.date,
      r.userName,
      r.mode === 'INDIVIDUAL' ? `${r.mode} (${r.individualType})` : r.mode,
      r.idField,
      r.quantity,
      r.calculatedValue.toFixed(2),
      new Date(r.createdAt).toLocaleString('pt-BR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
};