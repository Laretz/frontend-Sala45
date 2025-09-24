export interface User {
  id: string;
  name: string;
  email: string;
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
