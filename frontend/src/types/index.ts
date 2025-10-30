export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time_from: string;
  time_to: string;
  location: string;
  total_participants?: number;
  attendances?: AttendanceWithDetails[];
}

export interface Attendance {
  id: string;
  user_id: string;
  event_id: string;
  status: 'confirmed' | 'declined';
  additional_players: number;
  comment?: string;
}

export interface Equipment {
  id: string;
  attendance_id: string;
  type: 'ball' | 'pump' | 'overboots';
}

export interface AttendanceWithDetails extends Attendance {
  users: {
    id: string;
    name: string;
  };
  equipment: Equipment[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EquipmentSummary {
  ball?: { user_name: string; user_id: string }[];
  pump?: { user_name: string; user_id: string }[];
  overboots?: { user_name: string; user_id: string }[];
}
