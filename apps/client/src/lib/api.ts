const API_BASE_URL = 'http://localhost:3001';

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string | null;
      first_name: string;
      last_name: string;
      role: string;
      organization_id: string | null;
      is_active: boolean;
      email_verified: boolean;
      force_password_change: boolean;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    forcePasswordChange?: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

export interface SignupRequest {
  username?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface SigninRequest {
  username: string;
  password: string;
}

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.accessToken = localStorage.getItem('accessToken');
  }

  setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401, try to refresh the token once
    if (response.status === 401 && endpoint !== '/api/auth/signin' && endpoint !== '/api/auth/refresh') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data?.tokens) {
              this.setToken(refreshData.data.tokens.accessToken);
              localStorage.setItem('refreshToken', refreshData.data.tokens.refreshToken);

              // Retry the original request with new token
              headers['Authorization'] = `Bearer ${this.accessToken}`;
              const retryResponse = await fetch(url, {
                ...options,
                headers,
              });

              if (retryResponse.ok) {
                return retryResponse.json();
              }
            }
          }
        } catch (error) {
          console.warn('Token refresh failed:', error);
        }
      }

      // If refresh failed, clear tokens and throw auth error
      this.clearToken();
      throw new Error(`Authentication failed: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.tokens) {
      this.setToken(response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }

    return response;
  }

  async signin(data: SigninRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.tokens) {
      this.setToken(response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }

    return response;
  }

  async signout(): Promise<void> {
    try {
      await this.request('/api/auth/signout', {
        method: 'POST',
      });
    } finally {
      this.clearToken();
    }
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async checkHealth() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();