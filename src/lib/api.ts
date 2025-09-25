import { Meeting, Room, CreateMeetingData, CreateRoomData  } from '@/types/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Adicionar token de autenticação se disponível
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Erro na requisição'
        };
      }

      return {
        data
      };
    } catch (error) {
      return {
        error: 'Erro de conexão com o servidor'
      };
    }
  }

  // Métodos de autenticação
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Métodos para reservas
  async getMeetings(): Promise<ApiResponse<Meeting[]>> {
    return this.request('/meetings');
  }

  async createMeeting(meetingData: CreateMeetingData): Promise<ApiResponse<Meeting>> {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData),
    });
  }

  async updateMeeting(id: string, meetingData: any) {
    return this.request(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(meetingData),
    });
  }

  async deleteMeeting(id: string) {
    return this.request(`/meetings/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para salas
  async getRooms(): Promise<ApiResponse<Room[]>> {
    return this.request('/rooms');
  }

  async getRoomMeetings(roomId: string, date: string): Promise<ApiResponse<Meeting[]>> {
    return this.request(`/rooms/${roomId}/meetings/${date}`);
  }

  async createRoom(roomData: CreateRoomData): Promise<ApiResponse<Room>> {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id: string, roomData: any) {
    return this.request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
export default api;