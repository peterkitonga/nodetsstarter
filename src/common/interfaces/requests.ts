export interface AuthRequest {
  name?: string;
  email: string;
  password: string;
  password_confirmation?: string;
}

export interface ActivationRequest {
  code: string;
}
