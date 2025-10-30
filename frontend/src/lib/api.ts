const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(includeAuth),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  }

  async register(email: string, password: string, name: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }, false);
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Users endpoints
  async getAllUsers() {
    return this.request<{ users: any[] }>('/users');
  }

  async toggleUserStatus(userId: string, is_active: boolean) {
    return this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  }

  // Events endpoints
  async getAllEvents() {
    return this.request<{ events: any[] }>('/events');
  }

  async createEvent(event: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateEvent(eventId: string, event: any) {
    return this.request(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(event),
    });
  }

  async deleteEvent(eventId: string) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async getEventEquipment(eventId: string) {
    return this.request<{ equipment: any }>(`/events/${eventId}/equipment`);
  }

  // Attendance endpoints
  async createOrUpdateAttendance(eventId: string, data: any) {
    return this.request(`/attendance/${eventId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAttendance(eventId: string) {
    return this.request(`/attendance/${eventId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
