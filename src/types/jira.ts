// Jira DC Clone - Type Definitions
// MRTT+ Compliance Types included

export type ClassificationLevel = 'public' | 'restricted' | 'confidential' | 'export_controlled';
export type AppRole = 'admin' | 'project_admin' | 'developer' | 'viewer';
export type ProjectType = 'software' | 'business';
export type ProjectTemplate = 'scrum' | 'kanban' | 'basic' | 'project_management' | 'task_management' | 'process_management';
export type IssueTypeCategory = 'standard' | 'subtask' | 'epic';
export type SprintState = 'future' | 'active' | 'closed';
export type BoardType = 'scrum' | 'kanban';
export type StatusCategory = 'todo' | 'in_progress' | 'done';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  job_title?: string;
  department?: string;
  location?: string;
  timezone?: string;
  is_active: boolean;
  clearance_level?: ClassificationLevel;
  nationality?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  pkey: string;
  name: string;
  description?: string;
  project_type: ProjectType;
  template: ProjectTemplate;
  category_id?: string;
  lead_id?: string;
  lead?: User;
  default_assignee_id?: string;
  avatar_url?: string;
  url?: string;
  issue_counter: number;
  is_archived: boolean;
  classification: ClassificationLevel;
  program_id?: string;
  created_at: string;
  updated_at: string;
}

export interface IssueType {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color: string;
  category: IssueTypeCategory;
  is_subtask: boolean;
  position: number;
}

export interface Priority {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color: string;
  position: number;
}

export interface Resolution {
  id: string;
  name: string;
  description?: string;
  position: number;
}

export interface IssueStatus {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: StatusCategory;
  position: number;
}

export interface Issue {
  id: string;
  project_id: string;
  project?: Project;
  issue_key: string;
  issue_number: number;
  summary: string;
  description?: string;
  issue_type_id: string;
  issue_type?: IssueType;
  status_id: string;
  status?: IssueStatus;
  priority_id?: string;
  priority?: Priority;
  resolution_id?: string;
  resolution?: Resolution;
  reporter_id: string;
  reporter?: User;
  assignee_id?: string;
  assignee?: User;
  parent_id?: string;
  epic_id?: string;
  epic?: Issue;
  due_date?: string;
  original_estimate?: number;
  remaining_estimate?: number;
  time_spent?: number;
  story_points?: number;
  environment?: string;
  lexorank?: string;
  classification: ClassificationLevel;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  board_id: string;
  name: string;
  goal?: string;
  state: SprintState;
  start_date?: string;
  end_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  name: string;
  project_id: string;
  project?: Project;
  board_type: BoardType;
  filter_jql?: string;
  is_private: boolean;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
  min_issues?: number;
  max_issues?: number;
  statuses?: IssueStatus[];
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  author?: User;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  issue_id: string;
  author_id: string;
  author?: User;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  classification: ClassificationLevel;
  created_at: string;
}

export interface Version {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  start_date?: string;
  release_date?: string;
  is_released: boolean;
  is_archived: boolean;
  position: number;
}

export interface Component {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  lead_id?: string;
  lead?: User;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
}

// Audit Log for MRTT+ Compliance
export interface AuditLog {
  id: string;
  user_id?: string;
  user?: User;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  classification_context?: ClassificationLevel;
  created_at: string;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}
