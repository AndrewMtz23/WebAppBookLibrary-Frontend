export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  username: string;
}

export type AuthResponse = AuthSession;
import { AuthSession } from '../../core/auth/auth-session.model';
