// Shared types and utilities for Settle projects

export interface User {
  id: string;
  name: string;
  email: string;
}

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export const formatDate = (date: Date): string => {
  return date.toISOString();
};
