export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  is_active: boolean;
  organization_id?: number;
  organization?: Organization;
  roles: Role[];
  volunteer?: Volunteer;
  last_login_at?: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  registration_number?: string;
  is_active: boolean;
}

export interface Volunteer {
  id: number;
  user_id: number;
  organization_id: number;
  volunteer_id: string;
  skills?: string;
  interests?: string;
  notes?: string;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  background_check_status: 'not_started' | 'in_progress' | 'cleared' | 'failed';
  total_hours: number;
  joined_date?: string;
  is_verified: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  user?: User;
  organization?: Organization;
  skills_list?: VolunteerSkill[];
  certificates?: Certificate[];
  created_at: string;
}

export interface VolunteerSkill {
  id: number;
  skill_name: string;
  proficiency: 'beginner' | 'intermediate' | 'expert';
}

export interface DonorProfile {
  id: number;
  donor_id: string;
  name: string;
  email?: string;
  phone?: string;
  donor_type: 'individual' | 'corporate' | 'trust' | 'government' | 'ngo' | 'other';
  is_anonymous: boolean;
  total_donated: number;
  is_recurring: boolean;
  donations_count?: number;
  created_at: string;
}

export interface Donation {
  id: number;
  receipt_number: string;
  amount: number;
  donation_type: 'cash' | 'cheque' | 'online' | 'in_kind' | 'bank_transfer' | 'upi';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  currency: string;
  donation_date: string;
  purpose?: string;
  notes?: string;
  transaction_id?: string;
  is_tax_exempted: boolean;
  is_anonymous: boolean;
  donor_profile?: DonorProfile;
  program?: Program;
  created_at: string;
}

export interface Program {
  id: number;
  name: string;
  slug: string;
  description?: string;
  objectives?: string;
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  location?: string;
  volunteer_target: number;
  banner_image?: string;
  events_count?: number;
  donations_count?: number;
  organization?: Organization;
  created_at: string;
}

export interface Event {
  id: number;
  program_id: number;
  organization_id: number;
  title: string;
  description?: string;
  location?: string;
  start_datetime: string;
  end_datetime: string;
  volunteer_needed: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  banner_image?: string;
  program?: Program;
  volunteer_assignments_count?: number;
  created_at: string;
}

export interface Expense {
  id: number;
  organization_id: number;
  program_id?: number;
  user_id: number;
  title: string;
  description?: string;
  amount: number;
  category: string;
  expense_date: string;
  status: 'pending' | 'approved' | 'rejected';
  bill_attachment?: string;
  approved_by?: string;
  approved_at?: string;
  program?: Program;
  user?: User;
  created_at: string;
}

export interface Certificate {
  id: number;
  volunteer_id: number;
  certificate_number: string;
  title: string;
  description?: string;
  hours_completed: number;
  issue_date: string;
  file_path?: string;
  volunteer?: Volunteer;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'general' | 'event' | 'urgent' | 'program';
  audience: 'all' | 'volunteers' | 'donors' | 'staff';
  is_published: boolean;
  published_at?: string;
  user?: User;
  created_at: string;
}

export interface AuditLog {
  id: number;
  action: string;
  model_type?: string;
  model_id?: number;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user?: User;
  created_at: string;
}

export interface DashboardStats {
  total_volunteers: number;
  active_volunteers: number;
  total_donations: number;
  monthly_donations: number;
  total_programs: number;
  active_programs: number;
  total_donors: number;
  total_expenses: number;
  volunteer_hours: number;
  net_funds: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
