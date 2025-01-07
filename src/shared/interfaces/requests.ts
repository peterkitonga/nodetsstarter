export interface AuthRequest {
  name?: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
  rememberMe?: boolean;
}

export interface ActivationRequest {
  code: string;
}

export interface ResetPasswordRequest {
  email?: string;
  token?: string;
  password?: string;
  passwordConfirmation?: string;
}

export interface FileRequest {
  file: string;
}
