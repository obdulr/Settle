import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { clearAuth } from './authUtils';
import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.settleinpeace.com';

type ApiData = Record<string, unknown>;

function api(token?: string) {
  return createJsonApiClient({
    getBaseUrl: () => API_URL,
    getToken: () => token ?? getToken(),
    onUnauthorized: clearAuth,
  });
}

function authenticatedApi(token: string) {
  if (!token) throw new Error('You must be signed in to access this resource.');
  return api(token);
}

// Auth
export function login(email: string, password: string) {
  return api()<ApiData>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function register(userData: ApiData) {
  return api()<ApiData>('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
}
export function forgotPassword(email: string) {
  return api()<ApiData>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}
export function resetPassword(token: string, password: string) {
  return api()<ApiData>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password, confirmPassword: password }),
  });
}
export function getProfile(token: string) {
  return authenticatedApi(token)<ApiData>('/auth/profile', { method: 'GET' });
}
export function updateProfile(token: string, data: ApiData) {
  return authenticatedApi(token)<ApiData>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
}

// Assessment / leads
export function submitAssessment(data: ApiData) {
  return api()<ApiData>('/leads/assessment', { method: 'POST', body: JSON.stringify(data) });
}
export function getUserLeads(token: string) {
  return authenticatedApi(token)<ApiData[]>('/leads/my-leads', { method: 'GET' });
}
export function getLeadById(token: string, id: string) {
  return authenticatedApi(token)<ApiData>(`/leads/${id}/details`, { method: 'GET' });
}

// Providers
export function getProviders(token?: string) {
  return api(token)<ApiData[]>('/providers', { method: 'GET' });
}
export function compareProviders(leadId: string, token?: string | null) {
  return api(token ?? undefined)<ApiData[]>(`/matching/recommended/${leadId}`, { method: 'GET' });
}
export function signupAsProvider(data: ApiData) {
  return api()<ApiData>('/providers/signup', { method: 'POST', body: JSON.stringify(data) });
}

// Debts
export function getDebts(token: string) {
  return authenticatedApi(token)<ApiData[]>('/debts', { method: 'GET' });
}
export function createDebt(token: string, data: ApiData) {
  return authenticatedApi(token)<ApiData>('/debts', { method: 'POST', body: JSON.stringify(data) });
}
export function updateDebt(token: string, id: string, data: ApiData) {
  return authenticatedApi(token)<ApiData>(`/debts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export function deleteDebt(token: string, id: string) {
  return authenticatedApi(token)<ApiData>(`/debts/${id}`, { method: 'DELETE' });
}

// Provider portal
export function getPortalLeads(token: string) {
  return authenticatedApi(token)<ApiData[]>('/matching/matched-leads', { method: 'GET' });
}
export function purchaseLead(token: string, leadId: string) {
  return authenticatedApi(token)<ApiData>(`/leads/${leadId}/purchase`, { method: 'POST' });
}
export function declineLead(token: string, leadId: string) {
  return authenticatedApi(token)<ApiData>(`/matching/${leadId}/decline`, { method: 'POST' });
}
export function getProviderBilling(token: string) {
  return authenticatedApi(token)<ApiData>('/providers/portal/stats', { method: 'GET' });
}
export function createCheckoutSession(token: string, packageType: number) {
  return authenticatedApi(token)<ApiData>('/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ credits: packageType }),
  });
}

export async function createCoachingCheckoutSession(token: string, returnUrl: string) {
  return authenticatedApi(token)<{ url: string; id: string }>('/stripe/coaching/checkout', {
    method: 'POST',
    body: JSON.stringify({ returnUrl }),
  });
}

// Matching
export function getMatches(token: string) {
  return authenticatedApi(token)<ApiData[]>('/matching/history', { method: 'GET' });
}
export function getMatchById(token: string, id: string) {
  return authenticatedApi(token)<ApiData>(`/matching/${id}`, { method: 'GET' });
}

export interface BudgetExpense {
  id?: string;
  name: string;
  amount: number;
  category: string;
  recurring?: boolean;
}

export interface Budget {
  id: string;
  monthlyIncome: number;
  expenses: BudgetExpense[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  type: 'debt_payoff' | 'savings' | 'emergency_fund';
  deadline?: string;
  completed: boolean;
}

export interface CoachingDashboard {
  budgets: Budget[];
  goals: Goal[];
  subscription: { status: string; stripeSubscriptionId: string | null; startedAt: string | null; canceledAt: string | null };
  summary: { totalMonthlyIncome: number; totalMonthlyExpenses: number; netMonthly: number; activeGoals: number; completedGoals: number; totalGoals: number };
}

export interface BudgetPayload { monthlyIncome: number; expenses?: BudgetExpense[]; }
export interface GoalPayload { title: string; targetAmount: number; currentAmount?: number; type?: Goal['type']; deadline?: string; }

function coachingApi() { return authenticatedApi(getToken() ?? ''); }
export function getCoachingDashboard() { return coachingApi()<CoachingDashboard>('/coaching/dashboard', { method: 'GET' }); }
export function getBudgets() { return coachingApi()<Budget[]>('/coaching/budgets', { method: 'GET' }); }
export function createBudget(data: BudgetPayload) { return coachingApi()<Budget>('/coaching/budgets', { method: 'POST', body: JSON.stringify(data) }); }
export function updateBudget(id: string, data: BudgetPayload) { return coachingApi()<Budget>(`/coaching/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export function deleteBudget(id: string) { return coachingApi()<{ success: boolean }>(`/coaching/budgets/${id}`, { method: 'DELETE' }); }
export function getGoals() { return coachingApi()<Goal[]>('/coaching/goals', { method: 'GET' }); }
export function createGoal(data: GoalPayload) { return coachingApi()<Goal>('/coaching/goals', { method: 'POST', body: JSON.stringify(data) }); }
export function updateGoalProgress(id: string, currentAmount: number) { return coachingApi()<Goal>(`/coaching/goals/${id}/progress`, { method: 'PUT', body: JSON.stringify({ currentAmount }) }); }
export function deleteGoal(id: string) { return coachingApi()<{ success: boolean }>(`/coaching/goals/${id}`, { method: 'DELETE' }); }
