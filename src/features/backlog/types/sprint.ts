export interface SprintWithDetails {
  id: string;
  name: string;
  goal: string | null;
  state: string;
  start_date: string | null;
  end_date: string | null;
  completed_date: string | null;
  created_at: string;
  issues: SprintIssue[];
  contributors: Contributor[];
  stats: SprintStats;
  history: SprintHistoryItem[];
}

export interface SprintIssue {
  id: string;
  issue_key: string;
  summary: string;
  status_name: string;
  status_category: string;
  status_color: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  issue_type_name: string;
  story_points: number | null;
}

export interface Contributor {
  id: string;
  name: string;
  avatar_url: string | null;
  issuesCompleted: number;
  storyPointsCompleted: number;
}

export interface SprintStats {
  totalIssues: number;
  completedIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completionRate: number;
  durationDays: number;
}

export interface SprintHistoryItem {
  id: string;
  action: string;
  actor_name: string | null;
  issue_key: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}
