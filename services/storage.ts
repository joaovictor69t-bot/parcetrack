import { User, UserRole, WorkRecord } from '../types';

const USERS_KEY = 'pt_users';
const RECORDS_KEY = 'pt_records';

// Admin credentials (In a real app, these are on the server, never in client code)
// We keep them here to simulate backend validation, but removed from the UI component.
const ADMIN_HASH = 'EVRI01'; 
const ADMIN_USER = 'admin';

// Initial Seed Data
const seedUsers = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    // Note: Storing passwords in plain text in localStorage is NOT secure for production.
    // This is strictly for the offline demo functionality requested.
    const admin: User = { id: 'admin-1', username: 'admin', password: ADMIN_HASH, name: 'Administrador', role: UserRole.ADMIN };
    const user1: User = { id: 'user-1', username: 'motorista1', password: '123', name: 'João Silva', role: UserRole.USER };
    const user2: User = { id: 'user-2', username: 'motorista2', password: '123', name: 'Maria Santos', role: UserRole.USER };
    localStorage.setItem(USERS_KEY, JSON.stringify([admin, user1, user2]));
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

  // New: Handle Authentication internally
  authenticate: (username: string, passwordInput: string): { success: boolean; user?: User; message?: string } => {
    const users = StorageService.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // Check password
    // For admin, we strictly check the specific credential
    if (user.role === UserRole.ADMIN) {
      if (passwordInput === ADMIN_HASH) { // Checking against "backend" constant
        return { success: true, user };
      } else {
        return { success: false, message: 'Credenciais de administrador inválidas.' };
      }
    }

    // For regular users
    if (user.password === passwordInput) {
       return { success: true, user };
    }

    return { success: false, message: 'Senha incorreta.' };
  },

  // New: Register User
  registerUser: (name: string, username: string, password: string): { success: boolean; user?: User; message?: string } => {
    const users = StorageService.getUsers();
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Este nome de usuário já existe.' };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      username,
      password, // In real app: bcrypt.hash(password)
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

  // Export helper
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