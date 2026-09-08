export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  email: string;
}

export type AuthResponse = AuthSession;
import { AuthSession } from '../../core/auth/auth-session.model';
