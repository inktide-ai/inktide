import { apiFetch, jsonOrThrow } from './client'

export interface DashboardStats {
  totalMemories: number
  monthlyApiCalls: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiFetch('/api/v1/stats/dashboard')
  return jsonOrThrow<DashboardStats>(res)
}
