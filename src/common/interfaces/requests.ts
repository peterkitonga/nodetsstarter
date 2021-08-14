export interface AuthRequest {
  name?: string;
  email: string;
  password: string;
  password_confirmation?: string;
  remember_me?: string;
}

export interface ActivationRequest {
  code: string;
}

export interface ResetPasswordRequest {
  email?: string;
  token?: string;
  password?: string;
  password_confirmation?: string;
}
