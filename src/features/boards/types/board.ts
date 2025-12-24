import type { ClassificationLevel } from '@/types/jira';

export interface BoardIssue {
  readonly id: string;
  readonly issue_key: string;
  readonly summary: string;
  readonly issue_type: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Subtask';
  readonly priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  readonly status: string;
  readonly assignee?: {
    readonly display_name: string;
    readonly avatar_url?: string;
  };
  readonly story_points?: number;
  readonly classification?: ClassificationLevel;
  readonly labels?: readonly string[];
  readonly created_at?: string;
  readonly updated_at?: string;
  readonly due_date?: string;
  readonly epic_name?: string;
  readonly epic_color?: string;
}

export interface ColumnStatus {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
}

export interface BoardColumn {
  readonly id: string;
  readonly name: string;
  readonly statusCategory: 'todo' | 'in_progress' | 'done';
  readonly maxIssues?: number;
  readonly minIssues?: number;
  readonly statusIds?: readonly string[];
  readonly statuses?: readonly ColumnStatus[];
}

export interface TeamMember {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url?: string;
}
