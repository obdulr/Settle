import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { clearAuth, getStoredToken } from './authUtils';

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
  subscription: {
    status: string;
    stripeSubscriptionId: string | null;
    startedAt: string | null;
    canceledAt: string | null;
  };
  summary: {
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netMonthly: number;
    activeGoals: number;
    completedGoals: number;
    totalGoals: number;
  };
}

export interface BudgetPayload {
  monthlyIncome: number;
  expenses?: BudgetExpense[];
}

export interface GoalPayload {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  type?: Goal['type'];
  deadline?: string;
}

function coachingApi() {
  const token = getStoredToken();
  if (!token) {
    throw new Error('You must be signed in to access coaching.');
  }

  return createJsonApiClient({
    getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025',
    getToken: () => token,
    onUnauthorized: clearAuth,
  });
}

export function getCoachingDashboard() {
  return coachingApi()<CoachingDashboard>('/coaching/dashboard', { method: 'GET' });
}

export function getBudgets() {
  return coachingApi()<Budget[]>('/coaching/budgets', { method: 'GET' });
}

export function createBudget(data: BudgetPayload) {
  return coachingApi()<Budget>('/coaching/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateBudget(id: string, data: BudgetPayload) {
  return coachingApi()<Budget>(`/coaching/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteBudget(id: string) {
  return coachingApi()<{ success: boolean }>(`/coaching/budgets/${id}`, { method: 'DELETE' });
}

export function getGoals() {
  return coachingApi()<Goal[]>('/coaching/goals', { method: 'GET' });
}

export function createGoal(data: GoalPayload) {
  return coachingApi()<Goal>('/coaching/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateGoalProgress(id: string, currentAmount: number) {
  return coachingApi()<Goal>(`/coaching/goals/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ currentAmount }),
  });
}

export function deleteGoal(id: string) {
  return coachingApi()<{ success: boolean }>(`/coaching/goals/${id}`, { method: 'DELETE' });
}
