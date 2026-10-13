export type UserRole = "admin" | "viewer";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface ManagedUserInput {
  name: string;
  role: UserRole;
  roomIds: string[];
}

export interface ManagedUser extends User {
  roomIds: string[];
}

export interface UserFormErrors {
  name?: string;
}

export interface AuthFormErrors {
  name?: string;
  email?: string;
  password?: string;
}
