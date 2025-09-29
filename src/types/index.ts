export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'RH' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number; // Duração em minutos
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  roomId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  user?: User;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  meetings?: Meeting[];
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number; // Duração em minutos (30, 60, 120)
  roomId: string;
}

export interface CreateRoomData {
  name: string;
  description?: string;
  capacity: number;
  location?: string;
}

export interface UpdateMeetingData extends Partial<CreateMeetingData> {}

export interface UpdateRoomData extends Partial<CreateRoomData> {}

export interface ApiError {
  error: string;
  details?: any[];
}

// Ensure this file is treated as a module
export {};
