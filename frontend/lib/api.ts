// Central API client — all fetch calls go through here
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Session-only token (cleared on browser close)
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null


  const cleanPath = path.replace(/^\/+/, '')   // leading slash hata
  const url = `${BASE_URL}/${cleanPath}`   
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || data.error || 'Something went wrong')
  return data as T
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string; email: string; password: string
  bio?: string; location?: string; phone?: string; website?: string
}
export interface LoginPayload    { email: string; password: string }
export interface AuthResponse {
  msg?: string; error?: string; token?: string; access_token?: string
  user?: { id: string; name: string; email: string }
}
export const authApi = {
  register: (p: RegisterPayload) => request<AuthResponse>('/users/register', { method: 'POST', body: JSON.stringify(p) }),
  login:    (p: LoginPayload)    => request<AuthResponse>('/users/login',    { method: 'POST', body: JSON.stringify(p) }),
}

// ─── Courses ──────────────────────────────────────────────────────────────────
export interface ApiCourse {
  id: string; title: string; description: string; price: number
  category?: string; level?: string; instructor?: string; duration?: string
  students?: number; rating?: number; reviews?: number; image?: string
}
export const coursesApi = {
  list: () => request<ApiCourse[]>('/courses/'),
  get:  (id: string) => request<ApiCourse>(`/courses/${id}`),
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export interface CreateOrderPayload {
  user_id: string; course_id: string; amount: number
  discount_code?: string; discount_amount?: number; reference?: string
  batch_id?: string
}
export interface OrderResponse { msg: string; order_id?: string }
export interface DiscountResult {
  valid: boolean; message: string; discount_amount: number
  final_amount: number; code?: string
}

export const ordersApi = {
  create: (p: CreateOrderPayload) =>
    request<OrderResponse>('/orders/', { method: 'POST', body: JSON.stringify(p) }),

  validateDiscount: (code: string, course_id: string, original_amount: number) =>
    request<DiscountResult>('/orders/validate-discount', {
      method: 'POST',
      body: JSON.stringify({ code, course_id, original_amount }),
    }),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string; name: string; email: string
  bio?: string; location?: string; phone?: string; website?: string; created_at?: string
}
export interface UpdateProfilePayload {
  name?: string; bio?: string; location?: string; phone?: string; website?: string
}
export const usersApi = {
  me:          (userId: string)                          => request<UserProfile>(`/users/me?user_id=${userId}`),
  update:      (userId: string, p: UpdateProfilePayload) => request<{ msg: string }>(`/users/me?user_id=${userId}`, { method: 'PATCH', body: JSON.stringify(p) }),
  enrollments: (userId: string)                          => request<{ course_id: string; progress: number; enrolled_at: string }[]>(`/users/${userId}/enrollments`),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats { courses: number; users: number; total_enrollments?: number; total_revenue?: number }
export const dashboardApi = { stats: () => request<DashboardStats>('/dashboard/stats') }

// ─── Enquiry ──────────────────────────────────────────────────────────────────
export interface EnquiryPayload {
  name: string; age: number; email: string; mobile: string; enquiry: string; reference?: string
}
export const enquiryApi = {
  submit: (p: EnquiryPayload) => request<{ msg: string }>('/enquiry/', { method: 'POST', body: JSON.stringify(p) }),
}

// ─── Password & Account ───────────────────────────────────────────────────────
export const accountApi = {
  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    request<{ msg: string }>('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, current_password: currentPassword, new_password: newPassword }),
    }),
  deleteAccount: (userId: string) =>
    request<{ msg: string }>(`/users/me?user_id=${userId}`, { method: 'DELETE' }),
}

// ─── Admin ────────────────────────────────────────────────────────────────────

function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null
  const cleanPath = path.replace(/^\/+/, '')
  const url = `${BASE_URL}/${cleanPath}`
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Admin-Token': token } : {}),
      ...options.headers,
    },
    ...options,
  }).then(async res => {
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || data.error || 'Request failed')
    return data as T
  })
}

export interface AdminStats {
  total_users: number; total_courses: number; total_enrollments: number
  total_orders: number; total_revenue: number; total_enquiries: number
}

export interface AdminCourse {
  id: string; title: string; description: string; price: number
  category?: string; level?: string; instructor?: string; duration?: string; image?: string
}

export interface AdminEnrollment {
  enrollment_id: string; user_id: string; student_name: string; student_email: string
  course_id: string; course_title: string; progress: number; reference: string
  enrolled_at: string; amount_paid: number | string; discount_code: string; discount_amount: number
}

export interface AdminDiscount {
  code: string; type: string; value: number; max_uses: number
  used: number; active: string; course_id: string; times_used?: number
}

export interface AdminEnquiry {
  name: string; age: number; email: string; mobile: string
  enquiry: string; reference: string; submitted_at: string
}

export interface PublicStats {
  total_students: number; total_courses: number; total_enrollments: number
  courses: { id: string; title: string; instructor: string; category: string }[]
}

export const adminApi = {
  login:     (email: string, password: string) =>
    adminRequest<{ access_token: string }>('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  stats:     () => adminRequest<AdminStats>('/admin/stats'),

  // Courses
  getCourses:    () => adminRequest<AdminCourse[]>('/admin/courses'),
  createCourse:  (c: Omit<AdminCourse, 'id'>) => adminRequest<{ msg: string; id: string }>('/admin/courses', { method: 'POST', body: JSON.stringify(c) }),
  updateCourse:  (id: string, c: Omit<AdminCourse, 'id'>) => adminRequest<{ msg: string }>(`/admin/courses/${id}`, { method: 'PATCH', body: JSON.stringify(c) }),
  deleteCourse:  (id: string) => adminRequest<{ msg: string }>(`/admin/courses/${id}`, { method: 'DELETE' }),

  // Enrollments
  getEnrollments: (discountCode?: string) =>
    adminRequest<AdminEnrollment[]>(`/admin/enrollments${discountCode ? `?discount_code=${discountCode}` : ''}`),

  // Enquiries
  getEnquiries: () => adminRequest<AdminEnquiry[]>('/admin/enquiries'),

  // Discounts
  getDiscounts:   () => adminRequest<AdminDiscount[]>('/admin/discounts'),
  createDiscount: (d: { code?: string; type: string; value: number; max_uses: number; course_id?: string; active: boolean }) =>
    adminRequest<{ msg: string; code: string }>('/admin/discounts', { method: 'POST', body: JSON.stringify(d) }),
  toggleDiscount: (code: string, active: boolean) =>
    adminRequest<{ msg: string }>(`/admin/discounts/${code}?active=${active}`, { method: 'PATCH' }),
  deleteDiscount: (code: string) => adminRequest<{ msg: string }>(`/admin/discounts/${code}`, { method: 'DELETE' }),

  // Public stats (no auth)
  publicStats: () => fetch(`${BASE_URL}/admin/public-stats`).then(r => r.json()) as Promise<PublicStats>,
}

// ─── Member (referral partner) ────────────────────────────────────────────────

export interface MemberProfile {
  id: string
  name: string
  email: string
  coupon_code: string
  commission_rate: number
}

export interface MemberLoginResponse {
  access_token: string
  token_type: string
  member: MemberProfile
}

export interface MemberStats {
  total_referrals: number
  total_earned: number
  pending_payout: number
  paid_out: number
  coupon_code: string
  commission_rate: number
}

export interface MemberReferral {
  id: string
  student_name: string
  course_title: string
  coupon_code: string
  order_amount: number
  commission_rate: number
  commission_earned: number
  payout_status: 'pending' | 'paid'
  created_at: string
}

function memberRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('memberToken') : null

  const cleanPath = path.replace(/^\/+/, '')
  const url = `${BASE_URL}/${cleanPath}`

  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  }).then(async res => {
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || data.error || 'Request failed')
    return data as T
  })
}

export const memberApi = {
  login:     (email: string, password: string) =>
    memberRequest<MemberLoginResponse>('/members/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  profile:   () => memberRequest<MemberProfile>('/members/me/profile'),
  stats:     () => memberRequest<MemberStats>('/members/me/stats'),
  referrals: () => memberRequest<MemberReferral[]>('/members/me/referrals'),
}

// ─── Admin member management ──────────────────────────────────────────────────

export interface AdminMember {
  id: string; name: string; email: string; coupon_code: string
  commission_rate: number; active: string; total_referrals: number
  total_earned: number; pending_payout: number; total_paid: number; created_at: string
}

export interface AdminMemberReferral {
  id: string; member_id: string; order_id: string; student_id: string
  course_id: string; coupon_code: string; order_amount: number
  commission_rate: number; commission_earned: number
  payout_status: string; created_at: string
  student_name: string; student_email: string; course_title: string
}

// These are added to the existing adminApi object — paste into adminApi in api.ts:
// createMember, listMembers, getMemberReferrals, updateMemberCommission, processPayout
export const adminMemberApi = {
  create: (m: { name: string; email: string; password: string; commission_rate: number; coupon_code: string }) =>
    adminRequest<{ msg: string; id: string }>('/admin/members', { method: 'POST', body: JSON.stringify(m) }),
  list: () => adminRequest<AdminMember[]>('/admin/members'),
  getReferrals: (memberId: string) =>
    adminRequest<AdminMemberReferral[]>(`/admin/members/${memberId}/referrals`),
  updateCommission: (memberId: string, commission_rate: number) =>
    adminRequest<{ msg: string }>(`/admin/members/${memberId}/commission`, {
      method: 'PATCH', body: JSON.stringify({ commission_rate }),
    }),
  toggleActive: (memberId: string, active: boolean) =>
    adminRequest<{ msg: string }>(`/admin/members/${memberId}/commission`, {
      method: 'PATCH', body: JSON.stringify({ active }),
    }),
  payout: (memberId: string, body: { amount: number; payment_method?: string; notes?: string }) =>
    adminRequest<{ msg: string; referral_count: number }>(`/admin/members/${memberId}/payout`, {
      method: 'POST', body: JSON.stringify(body),
    }),
}

// ─── Batches ──────────────────────────────────────────────────────────────────
export interface ApiBatch {
  id: string
  course_id: string
  name: string          // e.g. "Batch 12 – Morning"
  start_date: string    // ISO date string  "2025-06-01"
  timing: string        // e.g. "Mon/Wed/Fri  9:00 AM – 11:00 AM"
  seats_total: number
  seats_filled: number
  mode: 'Online' | 'Offline' | 'Hybrid'
  is_active: boolean
}

export const batchesApi = {
  listByCourse: (courseId: string) =>
    request<ApiBatch[]>(`/batches/?course_id=${courseId}`),
}

// ─── Admin Batch management ───────────────────────────────────────────────────
export const adminBatchApi = {
  list: (courseId?: string) =>
    adminRequest<ApiBatch[]>(`/batches/admin${courseId ? `?course_id=${courseId}` : ''}`),

  create: (b: Omit<ApiBatch, 'id'>) =>
    adminRequest<{ msg: string; id: string }>(
      '/batches/admin',
      { method: 'POST', body: JSON.stringify(b) }
    ),

  update: (id: string, b: Partial<Omit<ApiBatch, 'id'>>) =>
    adminRequest<{ msg: string }>(
      `/batches/admin/${id}`,
      { method: 'PATCH', body: JSON.stringify(b) }
    ),

  delete: (id: string) =>
    adminRequest<{ msg: string }>(
      `/batches/admin/${id}`,
      { method: 'DELETE' }
    ),
}