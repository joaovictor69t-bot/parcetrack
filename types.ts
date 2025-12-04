export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum RecordMode {
  INDIVIDUAL = 'INDIVIDUAL',
  AREA = 'AREA'
}

export enum IndividualType {
  PARCEL = 'PARCEL',
  COLLECTION = 'COLLECTION'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Added for local storage auth simulation
  name: string;
  role: UserRole;
}

export interface Photo {
  id: string;
  dataUrl: string; // Storing base64 for this demo app. In prod, this would be a URL.
  timestamp: number;
}

export interface WorkRecord {
  id: string;
  userId: string;
  userName: string; // Denormalized for easier admin viewing
  date: string; // ISO YYYY-MM-DD
  mode: RecordMode;
  individualType?: IndividualType;
  areaIdCount?: number; // 1 or 2
  idField: string; // The specific Route ID entered by user
  quantity: number;
  calculatedValue: number;
  photos: Photo[];
  createdAt: number;
}

export interface CalculationResult {
  value: number;
  breakdown: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}