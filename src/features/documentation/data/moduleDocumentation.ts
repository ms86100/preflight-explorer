import { ModuleDoc } from '../types';

export const moduleDocumentation: ModuleDoc[] = [
  {
    id: 'projects',
    name: 'Projects',
    description: 'Project management and configuration',
    purpose: 'Provides the foundation for organizing work. Each project contains issues, boards, workflows, and team configurations.',
    components: ['CreateProjectModal.tsx'],
    hooks: ['useProjects.ts'],
    services: ['projectService.ts'],
    userFlow: [
      'User navigates to Projects page',
      'Clicks "Create Project" button',
      'Fills in project details (name, key, description)',
      'Selects project type (Kanban/Scrum)',
      'Project is created with default configurations',
      'User is redirected to the new project board'
    ],
    roles: {
      admin: ['Create projects', 'Delete projects', 'Modify project settings', 'Manage project permissions'],
      user: ['View assigned projects', 'Access project boards', 'Create issues within projects']
    },
    preconditions: ['User must be authenticated', 'User must have project creation permissions'],
    postconditions: ['Project appears in project list', 'Default board is created', 'Default statuses are applied'],
    edgeCases: ['Duplicate project key validation', 'Project key format validation (uppercase, no spaces)', 'Maximum project name length'],
    associatedDiagrams: ['system-architecture', 'core-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/projects', description: 'List all accessible projects', authentication: 'required', responseBody: 'Project[]' },
      { method: 'GET', path: '/api/projects/:id', description: 'Get project by ID', authentication: 'required', responseBody: 'Project' },
      { method: 'POST', path: '/api/projects', description: 'Create a new project', authentication: 'required', requestBody: '{ name, key, description, projectType }', responseBody: 'Project' },
      { method: 'PUT', path: '/api/projects/:id', description: 'Update project settings', authentication: 'required', requestBody: '{ name?, description?, settings? }', responseBody: 'Project' },
      { method: 'DELETE', path: '/api/projects/:id', description: 'Delete project (admin only)', authentication: 'required', responseBody: '{ success: boolean }' }
    ],
    implementationDetails: [
      { area: 'Database Schema', description: 'Projects table with RLS policies for team-based access control', status: 'implemented' },
      { area: 'Validation', description: 'Zod schema validation for project creation/update', status: 'implemented' },
      { area: 'Default Board Creation', description: 'Automatic Kanban/Scrum board setup on project creation', status: 'implemented' },
      { area: 'Project Templates', description: 'Pre-configured project templates for common use cases', status: 'planned' }
    ]
  },
  {
    id: 'issues',
    name: 'Issues',
    description: 'Issue creation, tracking, and management',
    purpose: 'Core work item tracking. Issues represent tasks, bugs, stories, or epics that teams work on.',
    components: ['CreateIssueModal.tsx', 'IssueDetailModal.tsx', 'AttachmentsSection.tsx', 'ComponentsSection.tsx', 'IssueHistorySection.tsx', 'LinkedIssuesSection.tsx', 'TimeTrackingSection.tsx', 'VersionsSection.tsx'],
    hooks: ['useIssues.ts'],
    services: ['issueService.ts'],
    userFlow: [
      'User clicks "Create Issue" or uses keyboard shortcut',
      'Selects issue type (Bug, Story, Task, Epic)',
      'Fills required fields (summary, description)',
      'Optionally sets assignee, priority, labels, sprint',
      'Issue is created with auto-generated key (e.g., PROJ-123)',
      'Issue appears on board/backlog based on status'
    ],
    roles: {
      admin: ['Delete any issue', 'Bulk operations', 'Configure issue types'],
      user: ['Create issues', 'Edit assigned issues', 'Transition issues', 'Add comments', 'Log time']
    },
    preconditions: ['Project must exist', 'User must have issue creation permission', 'Required fields must be filled'],
    postconditions: ['Issue key is generated', 'Issue history is initialized', 'Notifications are sent to watchers'],
    edgeCases: ['Issue key collision handling', 'Circular parent-child prevention', 'Epic link validation', 'Time tracking overflow'],
    associatedDiagrams: ['issue-lifecycle', 'core-erd', 'data-flow'],
    apiDocumentation: [
      { method: 'GET', path: '/api/issues', description: 'List issues with filters and pagination', authentication: 'required', responseBody: '{ data: Issue[], total: number }' },
      { method: 'GET', path: '/api/issues/:key', description: 'Get issue by key (e.g., PROJ-123)', authentication: 'required', responseBody: 'Issue' },
      { method: 'POST', path: '/api/issues', description: 'Create a new issue', authentication: 'required', requestBody: '{ projectId, issueTypeId, summary, description?, assigneeId?, priorityId? }', responseBody: 'Issue' },
      { method: 'PATCH', path: '/api/issues/:id', description: 'Update issue fields', authentication: 'required', requestBody: '{ summary?, description?, statusId?, assigneeId? }', responseBody: 'Issue' },
      { method: 'DELETE', path: '/api/issues/:id', description: 'Delete issue (admin only)', authentication: 'required', responseBody: '{ success: boolean }' },
      { method: 'POST', path: '/api/issues/:id/transition', description: 'Transition issue to new status', authentication: 'required', requestBody: '{ statusId, comment? }', responseBody: 'Issue' }
    ],
    implementationDetails: [
      { area: 'Issue Key Generation', description: 'Auto-increment issue number per project with format PROJECT-###', status: 'implemented' },
      { area: 'History Tracking', description: 'All field changes logged with before/after values and actor', status: 'implemented' },
      { area: 'Workflow Validation', description: 'Transition rules enforced via workflow engine', status: 'implemented' },
      { area: 'Full-text Search', description: 'PostgreSQL full-text search on summary and description', status: 'implemented' },
      { area: 'Real-time Updates', description: 'Supabase realtime subscriptions for live issue updates', status: 'implemented' }
    ]
  },
  {
    id: 'boards',
    name: 'Boards',
    description: 'Kanban and Scrum board visualization',
    purpose: 'Visual representation of work progress. Boards display issues in columns representing workflow states.',
    components: ['BasicBoard.tsx', 'BoardColumn.tsx', 'BoardSettingsModal.tsx', 'BoardToolbar.tsx', 'ColumnConfigPanel.tsx', 'IssueCard.tsx', 'KanbanBoard.tsx', 'ScrumBoard.tsx', 'SprintHeader.tsx'],
    hooks: ['useBoardState.ts', 'useBoardTransitionValidation.ts', 'useBoards.ts'],
    services: ['boardService.ts'],
    userFlow: [
      'User navigates to project board',
      'Board displays columns based on workflow',
      'User drags issue card to new column',
      'Transition validation is checked',
      'Issue status is updated',
      'Board reflects new state'
    ],
    roles: {
      admin: ['Configure board columns', 'Set WIP limits', 'Manage board filters'],
      user: ['View board', 'Drag issues between columns', 'Quick edit issues', 'Filter board view']
    },
    preconditions: ['Board must be configured', 'User must have board access', 'Workflow must allow transition'],
    postconditions: ['Issue status is updated', 'Board column counts update', 'Activity is logged'],
    edgeCases: ['WIP limit exceeded warning', 'Invalid transition blocking', 'Concurrent drag operations', 'Large board performance'],
    associatedDiagrams: ['board-interaction', 'system-architecture'],
    apiDocumentation: [
      { method: 'GET', path: '/api/boards', description: 'List boards for a project', authentication: 'required', responseBody: 'Board[]' },
      { method: 'GET', path: '/api/boards/:id', description: 'Get board with columns and issues', authentication: 'required', responseBody: 'Board' },
      { method: 'POST', path: '/api/boards', description: 'Create a new board', authentication: 'required', requestBody: '{ projectId, name, boardType }', responseBody: 'Board' },
      { method: 'PUT', path: '/api/boards/:id/columns', description: 'Update column configuration', authentication: 'required', requestBody: '{ columns: Column[] }', responseBody: 'Board' },
      { method: 'PATCH', path: '/api/boards/:id/issue-order', description: 'Update issue ordering within columns', authentication: 'required', requestBody: '{ issueId, columnId, position }', responseBody: '{ success: boolean }' }
    ],
    implementationDetails: [
      { area: 'Drag and Drop', description: 'React DnD for smooth card dragging with optimistic updates', status: 'implemented' },
      { area: 'WIP Limits', description: 'Configurable work-in-progress limits per column', status: 'implemented' },
      { area: 'Column Status Mapping', description: 'Multiple statuses can map to single column', status: 'implemented' },
      { area: 'Board Filters', description: 'JQL-like filtering for board views', status: 'implemented' },
      { area: 'Swimlanes', description: 'Horizontal grouping by assignee, epic, or priority', status: 'planned' }
    ]
  },
  {
    id: 'backlog',
    name: 'Backlog',
    description: 'Sprint planning and backlog management',
    purpose: 'Prioritize and organize work items. Manage sprints, plan capacity, and track velocity.',
    components: ['BacklogView.tsx', 'DraggableBacklogView.tsx', 'SprintActivityFeed.tsx', 'SprintCardContent.tsx', 'SprintCompletionModal.tsx', 'SprintConfigModal.tsx', 'SprintHistoryPage.tsx', 'SprintHistoryView.tsx', 'SprintPlanningModal.tsx'],
    hooks: ['useCompletedSprints.ts'],
    services: [],
    userFlow: [
      'User views product backlog',
      'Prioritizes issues by dragging to reorder',
      'Creates new sprint with dates and goals',
      'Drags issues into sprint',
      'Starts sprint when ready',
      'Completes sprint and handles incomplete items'
    ],
    roles: {
      admin: ['Create/delete sprints', 'Configure sprint settings', 'Override sprint completion'],
      user: ['View backlog', 'Reorder items', 'Move issues to sprints', 'View sprint reports']
    },
    preconditions: ['Project must use Scrum methodology', 'Backlog must have issues', 'Sprint dates must be valid'],
    postconditions: ['Sprint velocity is calculated', 'Incomplete items are handled', 'Sprint report is generated'],
    edgeCases: ['Overlapping sprint dates', 'Empty sprint completion', 'Mid-sprint scope changes', 'Sprint goal modification'],
    associatedDiagrams: ['sprint-planning', 'core-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/sprints', description: 'List sprints for a project', authentication: 'required', responseBody: 'Sprint[]' },
      { method: 'POST', path: '/api/sprints', description: 'Create a new sprint', authentication: 'required', requestBody: '{ projectId, name, startDate, endDate, goal? }', responseBody: 'Sprint' },
      { method: 'PUT', path: '/api/sprints/:id/start', description: 'Start a sprint', authentication: 'required', responseBody: 'Sprint' },
      { method: 'PUT', path: '/api/sprints/:id/complete', description: 'Complete sprint and handle remaining issues', authentication: 'required', requestBody: '{ moveToSprintId?, moveToBacklog? }', responseBody: 'Sprint' },
      { method: 'PATCH', path: '/api/backlog/reorder', description: 'Reorder backlog items', authentication: 'required', requestBody: '{ issueId, afterIssueId? }', responseBody: '{ success: boolean }' }
    ],
    implementationDetails: [
      { area: 'LexoRank Ordering', description: 'Efficient ranking system for backlog ordering without reindexing', status: 'implemented' },
      { area: 'Velocity Calculation', description: 'Automatic velocity tracking based on completed story points', status: 'implemented' },
      { area: 'Sprint Burndown', description: 'Daily progress tracking with ideal burndown line', status: 'implemented' },
      { area: 'Capacity Planning', description: 'Team capacity estimation based on availability', status: 'partial' }
    ]
  },
  {
    id: 'workflows',
    name: 'Workflows',
    description: 'Workflow design and transition rules',
    purpose: 'Define how issues move through their lifecycle. Configure statuses, transitions, and validation rules.',
    components: ['TransitionEditor.tsx', 'WorkflowComparison.tsx', 'WorkflowDesigner.tsx', 'WorkflowImportExport.tsx', 'WorkflowList.tsx', 'WorkflowSchemeManager.tsx'],
    hooks: ['useWorkflowExecution.ts', 'useWorkflows.ts'],
    services: ['workflowExecutionService.ts', 'workflowService.ts'],
    userFlow: [
      'Admin navigates to Workflow settings',
      'Creates new workflow or edits existing',
      'Adds statuses and connects with transitions',
      'Configures transition conditions and validators',
      'Associates workflow with issue types',
      'Workflow is active for new issues'
    ],
    roles: {
      admin: ['Create/edit workflows', 'Manage workflow schemes', 'Import/export workflows'],
      user: ['View workflow (if permitted)', 'Cannot modify workflows']
    },
    preconditions: ['Admin permissions required', 'Valid status configuration', 'No circular transitions'],
    postconditions: ['Workflow is validated', 'Existing issues can still transition', 'Scheme is updated'],
    edgeCases: ['Orphaned status handling', 'Breaking change detection', 'Workflow migration', 'Concurrent edits'],
    associatedDiagrams: ['issue-lifecycle', 'module-dependencies'],
    apiDocumentation: [
      { method: 'GET', path: '/api/workflows', description: 'List all workflows', authentication: 'required', responseBody: 'Workflow[]' },
      { method: 'GET', path: '/api/workflows/:id', description: 'Get workflow with transitions', authentication: 'required', responseBody: 'Workflow' },
      { method: 'POST', path: '/api/workflows', description: 'Create a new workflow', authentication: 'required', requestBody: '{ name, description, statuses, transitions }', responseBody: 'Workflow' },
      { method: 'PUT', path: '/api/workflows/:id', description: 'Update workflow configuration', authentication: 'required', requestBody: 'Workflow', responseBody: 'Workflow' },
      { method: 'POST', path: '/api/workflows/:id/validate-transition', description: 'Validate if transition is allowed', authentication: 'required', requestBody: '{ issueId, fromStatus, toStatus }', responseBody: '{ allowed: boolean, reason? }' }
    ],
    implementationDetails: [
      { area: 'Visual Designer', description: 'Drag-and-drop workflow editor with live preview', status: 'implemented' },
      { area: 'Transition Conditions', description: 'Field-based conditions for transition availability', status: 'implemented' },
      { area: 'Transition Validators', description: 'Required fields and custom validation before transition', status: 'implemented' },
      { area: 'Post Functions', description: 'Automatic actions after transition (assign, update fields)', status: 'implemented' },
      { area: 'Workflow Comparison', description: 'Side-by-side comparison of workflow versions', status: 'implemented' }
    ]
  },
  {
    id: 'git-integration',
    name: 'Git Integration',
    description: 'Repository connection and development tracking',
    purpose: 'Connect Git repositories to track commits, branches, pull requests, and deployments linked to issues.',
    components: ['BranchesList.tsx', 'BuildStatusBadge.tsx', 'CommitsList.tsx', 'CreateBranchModal.tsx', 'CreatePRModal.tsx', 'DeploymentsList.tsx', 'DevelopmentPanel.tsx', 'GitDemoToggle.tsx', 'GitIntegrationPanel.tsx', 'GitOrganizationForm.tsx', 'GitOrganizationsList.tsx', 'GitUserMappingManager.tsx', 'PullRequestsList.tsx', 'RepositoryLinker.tsx', 'RepositorySettingsModal.tsx', 'SyncStatusIndicator.tsx', 'TriggerBuildModal.tsx'],
    hooks: ['useGitModalRepositories.ts', 'useGitOrganizations.ts', 'useGitRepositories.ts', 'useIssueDevelopmentInfo.ts'],
    services: ['gitIntegrationService.ts', 'smartCommitParser.ts'],
    userFlow: [
      'Admin connects Git organization (GitHub/GitLab/Bitbucket)',
      'OAuth flow authenticates connection',
      'Repositories are synced',
      'Project is linked to repository',
      'Commits referencing issue keys are tracked',
      'Smart commits can transition issues'
    ],
    roles: {
      admin: ['Connect organizations', 'Link repositories', 'Configure webhooks', 'Manage user mappings'],
      user: ['View development info on issues', 'Create branches from issues', 'View commit history']
    },
    preconditions: ['Git provider account required', 'OAuth app configured', 'Repository access granted'],
    postconditions: ['Commits are linked to issues', 'Branches appear on issue panel', 'Smart commits are processed'],
    edgeCases: ['OAuth token expiration', 'Webhook delivery failures', 'Repository rename handling', 'User mapping conflicts'],
    associatedDiagrams: ['git-integration-flow', 'git-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/git/organizations', description: 'List connected Git organizations', authentication: 'required', responseBody: 'GitOrganization[]' },
      { method: 'POST', path: '/api/git/organizations', description: 'Connect a new Git organization', authentication: 'required', requestBody: '{ provider, hostUrl, accessToken }', responseBody: 'GitOrganization' },
      { method: 'GET', path: '/api/git/repositories', description: 'List repositories for an organization', authentication: 'required', responseBody: 'GitRepository[]' },
      { method: 'POST', path: '/api/git/repositories/:id/link', description: 'Link repository to project', authentication: 'required', requestBody: '{ projectId }', responseBody: 'GitRepository' },
      { method: 'GET', path: '/api/issues/:id/development', description: 'Get development info for an issue', authentication: 'required', responseBody: '{ branches, commits, pullRequests, builds }' },
      { method: 'POST', path: '/api/git/webhook', description: 'Receive Git provider webhooks', authentication: 'none', requestBody: 'WebhookPayload', responseBody: '{ success: boolean }' }
    ],
    implementationDetails: [
      { area: 'OAuth Flow', description: 'Secure OAuth2 integration with GitHub, GitLab, Bitbucket', status: 'implemented' },
      { area: 'Smart Commits', description: 'Parse commit messages for issue keys and commands (#time, #comment, #status)', status: 'implemented' },
      { area: 'Webhook Processing', description: 'Real-time sync via provider webhooks', status: 'implemented' },
      { area: 'User Mapping', description: 'Map Git emails to system users', status: 'implemented' },
      { area: 'Build Status', description: 'Display CI/CD build status on issues', status: 'implemented' }
    ]
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Project metrics and performance tracking',
    purpose: 'Visualize team performance, sprint progress, and project health through various charts and reports.',
    components: ['AgeingChart.tsx', 'BurndownChart.tsx', 'ContributorPerformance.tsx', 'ControlChart.tsx', 'CumulativeFlowChart.tsx', 'ExecutiveSummary.tsx', 'IssueTypeDistribution.tsx', 'LeadCycleTimeChart.tsx', 'OverdueAnalysis.tsx', 'PriorityBreakdown.tsx', 'RecentActivity.tsx', 'ReleaseBurndown.tsx', 'ResolutionTimeChart.tsx', 'SprintReport.tsx', 'TeamWorkloadChart.tsx', 'TrendAnalysis.tsx', 'VelocityChart.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'User navigates to Reports page',
      'Selects report type from available options',
      'Configures date range and filters',
      'Report data is fetched and visualized',
      'User can export or share report'
    ],
    roles: {
      admin: ['Access all reports', 'Configure report permissions', 'Schedule report delivery'],
      user: ['View permitted reports', 'Filter by assigned items', 'Export personal reports']
    },
    preconditions: ['Sufficient data for visualization', 'Report access permission', 'Valid date range'],
    postconditions: ['Report is rendered', 'Data is cached for performance', 'Export is generated'],
    edgeCases: ['No data scenarios', 'Large dataset performance', 'Date timezone handling', 'Incomplete sprint data'],
    associatedDiagrams: ['data-flow', 'module-dependencies'],
    apiDocumentation: [
      { method: 'GET', path: '/api/reports/burndown', description: 'Get sprint burndown data', authentication: 'required', responseBody: '{ dates: string[], ideal: number[], actual: number[] }' },
      { method: 'GET', path: '/api/reports/velocity', description: 'Get velocity chart data', authentication: 'required', responseBody: '{ sprints: Sprint[], velocity: number[] }' },
      { method: 'GET', path: '/api/reports/cumulative-flow', description: 'Get cumulative flow diagram data', authentication: 'required', responseBody: '{ dates: string[], statuses: Record<string, number[]> }' },
      { method: 'GET', path: '/api/reports/cycle-time', description: 'Get cycle time analytics', authentication: 'required', responseBody: '{ average: number, median: number, percentiles: Record<string, number> }' }
    ],
    implementationDetails: [
      { area: 'Chart Library', description: 'Recharts-based responsive visualizations', status: 'implemented' },
      { area: 'Data Aggregation', description: 'Server-side aggregation for performance', status: 'implemented' },
      { area: 'Date Range Filtering', description: 'Flexible date range selection with presets', status: 'implemented' },
      { area: 'Export Formats', description: 'Export to CSV and PDF formats', status: 'partial' },
      { area: 'Scheduled Reports', description: 'Email delivery of scheduled reports', status: 'planned' }
    ]
  },
  {
    id: 'custom-fields',
    name: 'Custom Fields',
    description: 'Dynamic field configuration for issues',
    purpose: 'Extend issue data with custom fields tailored to organization needs. Support various field types and contexts.',
    components: ['CustomFieldInput.tsx', 'CustomFieldsForm.tsx', 'CustomFieldsManager.tsx'],
    hooks: ['useCustomFields.ts'],
    services: ['customFieldService.ts'],
    userFlow: [
      'Admin creates new custom field definition',
      'Selects field type (text, number, date, select, etc.)',
      'Configures options and validation rules',
      'Assigns field to issue type contexts',
      'Field appears on issue create/edit forms',
      'Values are stored and searchable'
    ],
    roles: {
      admin: ['Create/edit field definitions', 'Manage field contexts', 'Delete unused fields'],
      user: ['View custom fields', 'Edit custom field values on issues']
    },
    preconditions: ['Admin permission for configuration', 'Valid field type selection', 'Context assignment'],
    postconditions: ['Field is available on forms', 'Existing issues can be updated', 'Search includes field'],
    edgeCases: ['Field type change restrictions', 'Required field enforcement', 'Default value application', 'Field deletion with data'],
    associatedDiagrams: ['core-erd', 'data-flow'],
    apiDocumentation: [
      { method: 'GET', path: '/api/custom-fields', description: 'List all custom field definitions', authentication: 'required', responseBody: 'CustomFieldDefinition[]' },
      { method: 'POST', path: '/api/custom-fields', description: 'Create a new custom field', authentication: 'required', requestBody: '{ name, fieldType, options?, validationRules? }', responseBody: 'CustomFieldDefinition' },
      { method: 'PUT', path: '/api/custom-fields/:id', description: 'Update custom field definition', authentication: 'required', requestBody: 'CustomFieldDefinition', responseBody: 'CustomFieldDefinition' },
      { method: 'GET', path: '/api/issues/:id/custom-fields', description: 'Get custom field values for an issue', authentication: 'required', responseBody: 'CustomFieldValue[]' },
      { method: 'PUT', path: '/api/issues/:id/custom-fields', description: 'Update custom field values', authentication: 'required', requestBody: '{ fieldId: value }[]', responseBody: 'CustomFieldValue[]' }
    ],
    implementationDetails: [
      { area: 'Field Types', description: 'Text, number, date, select, multi-select, user picker, URL', status: 'implemented' },
      { area: 'Validation Rules', description: 'Min/max, regex patterns, required validation', status: 'implemented' },
      { area: 'Context Scoping', description: 'Fields scoped to project and/or issue type', status: 'implemented' },
      { area: 'Search Integration', description: 'Custom fields included in issue search', status: 'implemented' }
    ]
  },
  {
    id: 'teams',
    name: 'Teams',
    description: 'Team organization and membership',
    purpose: 'Group users into teams for assignment, permissions, and workload management.',
    components: ['TeamManager.tsx'],
    hooks: ['useTeams.ts'],
    services: ['teamService.ts'],
    userFlow: [
      'Admin navigates to Team management',
      'Creates new team with name and description',
      'Adds members to team',
      'Assigns team lead',
      'Team can be assigned to issues',
      'Team workload is visible in reports'
    ],
    roles: {
      admin: ['Create/delete teams', 'Manage all team memberships', 'Configure team settings'],
      user: ['View team membership', 'See team assignments']
    },
    preconditions: ['Admin permission required', 'Users must exist to add', 'Unique team name'],
    postconditions: ['Team is created', 'Members are associated', 'Team is available for assignment'],
    edgeCases: ['User removal from team with active assignments', 'Team deletion with history', 'Circular team lead assignment'],
    associatedDiagrams: ['core-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/teams', description: 'List all teams', authentication: 'required', responseBody: 'Team[]' },
      { method: 'POST', path: '/api/teams', description: 'Create a new team', authentication: 'required', requestBody: '{ name, description?, leadId? }', responseBody: 'Team' },
      { method: 'PUT', path: '/api/teams/:id/members', description: 'Update team membership', authentication: 'required', requestBody: '{ memberIds: string[] }', responseBody: 'Team' },
      { method: 'GET', path: '/api/teams/:id/workload', description: 'Get team workload statistics', authentication: 'required', responseBody: '{ members: MemberWorkload[] }' }
    ],
    implementationDetails: [
      { area: 'Team Membership', description: 'Many-to-many user-team relationships', status: 'implemented' },
      { area: 'Workload Tracking', description: 'Issue count and story points per team member', status: 'implemented' },
      { area: 'Team Assignment', description: 'Assign issues to teams for collective ownership', status: 'partial' }
    ]
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'In-app notification system',
    purpose: 'Alert users about relevant activities like assignments, mentions, and status changes.',
    components: ['NotificationBell.tsx', 'NotificationsList.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Activity triggers notification (assignment, mention, etc.)',
      'Notification is created for relevant users',
      'Bell icon shows unread count',
      'User clicks to view notification list',
      'Clicking notification navigates to relevant item',
      'Notification is marked as read'
    ],
    roles: {
      admin: ['Configure notification rules', 'View system-wide notifications'],
      user: ['Receive personal notifications', 'Mark as read/unread', 'Configure preferences']
    },
    preconditions: ['User is subscribed to activity', 'Notification type is enabled'],
    postconditions: ['Notification is delivered', 'Unread count is updated', 'Activity is logged'],
    edgeCases: ['High-volume notification batching', 'Deleted item notifications', 'Permission changes affecting subscriptions'],
    associatedDiagrams: ['data-flow'],
    apiDocumentation: [
      { method: 'GET', path: '/api/notifications', description: 'Get user notifications', authentication: 'required', responseBody: '{ data: Notification[], unreadCount: number }' },
      { method: 'PATCH', path: '/api/notifications/:id/read', description: 'Mark notification as read', authentication: 'required', responseBody: 'Notification' },
      { method: 'PATCH', path: '/api/notifications/read-all', description: 'Mark all notifications as read', authentication: 'required', responseBody: '{ success: boolean }' },
      { method: 'PUT', path: '/api/notifications/preferences', description: 'Update notification preferences', authentication: 'required', requestBody: '{ emailEnabled?, types? }', responseBody: 'NotificationPreferences' }
    ],
    implementationDetails: [
      { area: 'Real-time Delivery', description: 'Supabase realtime for instant notifications', status: 'implemented' },
      { area: 'Notification Types', description: 'Assignment, mention, status change, comment', status: 'implemented' },
      { area: 'Email Notifications', description: 'Email delivery for important notifications', status: 'planned' },
      { area: 'Digest Mode', description: 'Daily/weekly notification digests', status: 'planned' }
    ]
  },
  {
    id: 'comments',
    name: 'Comments & Mentions',
    description: 'Issue discussion and @mention system',
    purpose: 'Enable team collaboration through issue comments with rich text and user mentions.',
    components: ['MentionTextarea.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'User opens issue detail',
      'Navigates to comments section',
      'Types comment with optional @mentions',
      'Mention autocomplete suggests users',
      'Comment is posted',
      'Mentioned users are notified'
    ],
    roles: {
      admin: ['Delete any comment', 'Moderate discussions'],
      user: ['Add comments', 'Edit own comments', 'Mention other users']
    },
    preconditions: ['Issue access required', 'Comment permission granted'],
    postconditions: ['Comment is saved', 'Mentions are extracted', 'Notifications sent'],
    edgeCases: ['Editing mentions after post', 'Deleted user mentions', 'Long comment handling', 'Concurrent edits'],
    associatedDiagrams: ['core-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/issues/:id/comments', description: 'Get comments for an issue', authentication: 'required', responseBody: 'Comment[]' },
      { method: 'POST', path: '/api/issues/:id/comments', description: 'Add a comment', authentication: 'required', requestBody: '{ body, mentions? }', responseBody: 'Comment' },
      { method: 'PUT', path: '/api/comments/:id', description: 'Edit a comment', authentication: 'required', requestBody: '{ body }', responseBody: 'Comment' },
      { method: 'DELETE', path: '/api/comments/:id', description: 'Delete a comment', authentication: 'required', responseBody: '{ success: boolean }' }
    ],
    implementationDetails: [
      { area: 'Rich Text Editor', description: 'Markdown support with live preview', status: 'implemented' },
      { area: 'Mention Parsing', description: 'Extract @mentions and create notifications', status: 'implemented' },
      { area: 'Comment History', description: 'Track edits to comments', status: 'partial' }
    ]
  },
  {
    id: 'automation',
    name: 'Automation Rules',
    description: 'Workflow automation and triggers',
    purpose: 'Automate repetitive tasks with rule-based triggers, conditions, and actions.',
    components: [],
    hooks: [],
    services: [],
    userFlow: [
      'Admin navigates to Automation settings',
      'Creates new automation rule',
      'Defines trigger (issue created, status changed, etc.)',
      'Adds conditions to filter when rule applies',
      'Configures actions (assign, transition, notify)',
      'Rule is enabled and runs automatically'
    ],
    roles: {
      admin: ['Create/edit automation rules', 'View execution logs', 'Disable/enable rules'],
      user: ['Cannot access automation configuration']
    },
    preconditions: ['Admin permission required', 'Valid trigger/action combination'],
    postconditions: ['Rule is saved', 'Trigger is registered', 'Actions execute on match'],
    edgeCases: ['Rule loop prevention', 'Failed action handling', 'Rate limiting', 'Permission context for actions'],
    associatedDiagrams: ['module-dependencies'],
    apiDocumentation: [
      { method: 'GET', path: '/api/automation/rules', description: 'List automation rules', authentication: 'required', responseBody: 'AutomationRule[]' },
      { method: 'POST', path: '/api/automation/rules', description: 'Create an automation rule', authentication: 'required', requestBody: '{ name, trigger, conditions, actions }', responseBody: 'AutomationRule' },
      { method: 'PUT', path: '/api/automation/rules/:id', description: 'Update automation rule', authentication: 'required', requestBody: 'AutomationRule', responseBody: 'AutomationRule' },
      { method: 'GET', path: '/api/automation/logs', description: 'Get automation execution logs', authentication: 'required', responseBody: 'AutomationLog[]' }
    ],
    implementationDetails: [
      { area: 'Trigger Types', description: 'Issue created, updated, transitioned, scheduled', status: 'implemented' },
      { area: 'Condition Builder', description: 'Field-based conditions with AND/OR logic', status: 'implemented' },
      { area: 'Action Types', description: 'Assign, transition, update field, send notification', status: 'implemented' },
      { area: 'Execution Logging', description: 'Full audit trail of rule executions', status: 'implemented' }
    ]
  },
  {
    id: 'migration',
    name: 'Data Migration',
    description: 'Import/export and data migration tools',
    purpose: 'Import data from external systems (CSV, other tools) and export for backup or migration.',
    components: ['CSVUploader.tsx', 'FieldMapper.tsx', 'FormatGuideModal.tsx', 'ImportHistory.tsx', 'ImportProgress.tsx', 'ImportWizard.tsx', 'TemplateDownload.tsx', 'ValidationPreview.tsx'],
    hooks: [],
    services: ['importService.ts', 'templateService.ts'],
    userFlow: [
      'Admin opens Import wizard',
      'Selects import type (issues, users, etc.)',
      'Uploads CSV or connects to source',
      'Maps source fields to system fields',
      'Validates data preview',
      'Executes import with progress tracking',
      'Reviews import results and errors'
    ],
    roles: {
      admin: ['Run imports', 'View import history', 'Download templates'],
      user: ['Cannot access migration tools']
    },
    preconditions: ['Admin permission required', 'Valid file format', 'Required fields mapped'],
    postconditions: ['Data is imported', 'Errors are logged', 'History is recorded'],
    edgeCases: ['Duplicate detection', 'Reference resolution', 'Large file handling', 'Partial failure recovery'],
    associatedDiagrams: ['data-flow'],
    apiDocumentation: [
      { method: 'POST', path: '/api/import/upload', description: 'Upload file for import', authentication: 'required', requestBody: 'FormData (file)', responseBody: '{ jobId, preview: Row[] }' },
      { method: 'POST', path: '/api/import/execute', description: 'Execute import job', authentication: 'required', requestBody: '{ jobId, mappings }', responseBody: '{ jobId, status }' },
      { method: 'GET', path: '/api/import/jobs/:id', description: 'Get import job status', authentication: 'required', responseBody: 'ImportJob' },
      { method: 'GET', path: '/api/import/templates/:type', description: 'Download import template', authentication: 'required', responseBody: 'CSV file' }
    ],
    implementationDetails: [
      { area: 'CSV Parsing', description: 'Robust CSV parser with encoding detection', status: 'implemented' },
      { area: 'Field Mapping', description: 'Visual field mapper with auto-detection', status: 'implemented' },
      { area: 'Validation', description: 'Pre-import validation with error preview', status: 'implemented' },
      { area: 'Progress Tracking', description: 'Real-time progress updates via websocket', status: 'implemented' },
      { area: 'Rollback', description: 'Rollback failed imports', status: 'partial' }
    ]
  },
  {
    id: 'plugins',
    name: 'Plugins & Extensions',
    description: 'Plugin management and feature flags',
    purpose: 'Extend platform functionality with plugins and control feature availability.',
    components: ['FeatureGate.tsx'],
    hooks: ['usePlugins.ts'],
    services: ['pluginService.ts'],
    userFlow: [
      'Admin navigates to Plugins page',
      'Views available plugins',
      'Enables/disables plugins',
      'Configures plugin settings',
      'Plugin features become available',
      'Feature gates control UI visibility'
    ],
    roles: {
      admin: ['Enable/disable plugins', 'Configure plugin settings', 'Install new plugins'],
      user: ['Use enabled plugin features']
    },
    preconditions: ['Admin permission for management', 'Plugin compatibility verified'],
    postconditions: ['Plugin state is updated', 'Features are toggled', 'Dependencies are checked'],
    edgeCases: ['Plugin dependency conflicts', 'Version compatibility', 'Data migration on disable'],
    associatedDiagrams: ['module-dependencies', 'system-architecture'],
    apiDocumentation: [
      { method: 'GET', path: '/api/plugins', description: 'List available plugins', authentication: 'required', responseBody: 'Plugin[]' },
      { method: 'PUT', path: '/api/plugins/:id/enable', description: 'Enable a plugin', authentication: 'required', responseBody: 'Plugin' },
      { method: 'PUT', path: '/api/plugins/:id/disable', description: 'Disable a plugin', authentication: 'required', responseBody: 'Plugin' },
      { method: 'PUT', path: '/api/plugins/:id/settings', description: 'Update plugin settings', authentication: 'required', requestBody: 'Record<string, any>', responseBody: 'Plugin' }
    ],
    implementationDetails: [
      { area: 'Feature Flags', description: 'Runtime feature toggling via FeatureGate component', status: 'implemented' },
      { area: 'Plugin Registry', description: 'Central plugin configuration management', status: 'implemented' },
      { area: 'Dependency Resolution', description: 'Automatic plugin dependency checking', status: 'partial' }
    ]
  },
  {
    id: 'ldap',
    name: 'LDAP Integration',
    description: 'Directory service authentication and sync',
    purpose: 'Integrate with enterprise LDAP/Active Directory for user authentication and group synchronization.',
    components: ['GroupMappingManager.tsx', 'LdapConfigurationForm.tsx', 'LdapConfigurationList.tsx', 'LdapSyncPanel.tsx'],
    hooks: [],
    services: ['ldapService.ts'],
    userFlow: [
      'Admin configures LDAP server connection',
      'Tests connection with bind credentials',
      'Configures user and group search filters',
      'Maps LDAP groups to application roles',
      'Runs initial sync',
      'Schedules periodic sync'
    ],
    roles: {
      admin: ['Configure LDAP connections', 'Manage group mappings', 'Run manual syncs'],
      user: ['Authenticate via LDAP']
    },
    preconditions: ['LDAP server accessible', 'Valid bind credentials', 'Network connectivity'],
    postconditions: ['Users are synced', 'Groups are mapped', 'Authentication is enabled'],
    edgeCases: ['Connection timeouts', 'Certificate validation', 'User conflict resolution', 'Sync failures'],
    associatedDiagrams: ['user-authentication-flow', 'system-architecture'],
    apiDocumentation: [
      { method: 'GET', path: '/api/ldap/configurations', description: 'List LDAP configurations', authentication: 'required', responseBody: 'LdapConfiguration[]' },
      { method: 'POST', path: '/api/ldap/configurations', description: 'Create LDAP configuration', authentication: 'required', requestBody: '{ hostUrl, bindDn, bindPassword, baseDn }', responseBody: 'LdapConfiguration' },
      { method: 'POST', path: '/api/ldap/configurations/:id/test', description: 'Test LDAP connection', authentication: 'required', responseBody: '{ success: boolean, error? }' },
      { method: 'POST', path: '/api/ldap/configurations/:id/sync', description: 'Trigger LDAP sync', authentication: 'required', responseBody: '{ syncedUsers: number, syncedGroups: number }' }
    ],
    implementationDetails: [
      { area: 'LDAP Connection', description: 'Secure LDAP/LDAPS connection handling', status: 'implemented' },
      { area: 'User Sync', description: 'Sync users from LDAP directory', status: 'implemented' },
      { area: 'Group Mapping', description: 'Map LDAP groups to application roles', status: 'implemented' },
      { area: 'Scheduled Sync', description: 'Periodic background synchronization', status: 'implemented' }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Features',
    description: 'Access control, audit logs, and bulk operations',
    purpose: 'Enterprise-grade security and administration features for compliance and large-scale management.',
    components: ['AccessControlManager.tsx', 'AuditLogsViewer.tsx', 'BulkOperations.tsx', 'PermissionSchemesManager.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Admin accesses Enterprise settings',
      'Configures permission schemes',
      'Reviews audit logs for compliance',
      'Performs bulk operations on issues',
      'Manages access control lists'
    ],
    roles: {
      admin: ['Full access to enterprise features', 'Configure security settings', 'View all audit logs'],
      user: ['Subject to access controls', 'Cannot view audit logs']
    },
    preconditions: ['Enterprise license active', 'Admin permissions required'],
    postconditions: ['Settings are applied', 'Audit trail is maintained', 'Bulk changes are logged'],
    edgeCases: ['Bulk operation rollback', 'Permission inheritance conflicts', 'Audit log retention'],
    associatedDiagrams: ['system-architecture', 'module-dependencies'],
    apiDocumentation: [
      { method: 'GET', path: '/api/audit-logs', description: 'Query audit logs', authentication: 'required', responseBody: '{ data: AuditLog[], total: number }' },
      { method: 'GET', path: '/api/permission-schemes', description: 'List permission schemes', authentication: 'required', responseBody: 'PermissionScheme[]' },
      { method: 'POST', path: '/api/permission-schemes', description: 'Create permission scheme', authentication: 'required', requestBody: 'PermissionScheme', responseBody: 'PermissionScheme' },
      { method: 'POST', path: '/api/bulk-operations', description: 'Execute bulk operation', authentication: 'required', requestBody: '{ operation, issueIds, changes }', responseBody: '{ affected: number, errors?: string[] }' }
    ],
    implementationDetails: [
      { area: 'Audit Logging', description: 'Comprehensive action logging with immutable storage', status: 'implemented' },
      { area: 'Permission Schemes', description: 'Reusable permission configurations', status: 'implemented' },
      { area: 'Bulk Operations', description: 'Mass update, transition, and delete operations', status: 'implemented' },
      { area: 'Access Control Lists', description: 'Fine-grained object-level permissions', status: 'partial' }
    ]
  },
  {
    id: 'compliance',
    name: 'Compliance & Classification',
    description: 'Data classification and compliance controls',
    purpose: 'Classify data sensitivity and enforce compliance policies for regulated industries.',
    components: ['ClassificationBadge.tsx', 'ComplianceDashboard.tsx', 'DataExportControls.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Admin configures classification levels',
      'Issues and attachments are classified',
      'Classification badges are displayed',
      'Export controls enforce policies',
      'Compliance dashboard shows status'
    ],
    roles: {
      admin: ['Configure classification levels', 'Set default classifications', 'Override classifications'],
      user: ['View classification badges', 'Cannot export restricted data']
    },
    preconditions: ['Compliance features enabled', 'Classification levels defined'],
    postconditions: ['Data is classified', 'Export restrictions enforced', 'Audit trail maintained'],
    edgeCases: ['Classification inheritance', 'Bulk reclassification', 'Export approval workflow'],
    associatedDiagrams: ['data-flow'],
    apiDocumentation: [
      { method: 'GET', path: '/api/compliance/classifications', description: 'List classification levels', authentication: 'required', responseBody: 'ClassificationLevel[]' },
      { method: 'PUT', path: '/api/issues/:id/classification', description: 'Set issue classification', authentication: 'required', requestBody: '{ level }', responseBody: 'Issue' },
      { method: 'POST', path: '/api/compliance/export-request', description: 'Request data export approval', authentication: 'required', requestBody: '{ issueIds, format }', responseBody: 'ExportRequest' },
      { method: 'GET', path: '/api/compliance/dashboard', description: 'Get compliance dashboard data', authentication: 'required', responseBody: 'ComplianceDashboard' }
    ],
    implementationDetails: [
      { area: 'Classification Levels', description: 'Configurable levels (Unclassified, Internal, Confidential, Restricted)', status: 'implemented' },
      { area: 'Classification Badges', description: 'Visual indicators on issues and attachments', status: 'implemented' },
      { area: 'Export Controls', description: 'Approval workflow for restricted data export', status: 'implemented' },
      { area: 'Compliance Dashboard', description: 'Overview of classification distribution', status: 'implemented' }
    ]
  },
  {
    id: 'document-composer',
    name: 'Document Composer',
    description: 'Document generation and export',
    purpose: 'Generate formatted documents from issue data using customizable templates.',
    components: ['DocumentComposer.tsx', 'ExportHistory.tsx', 'ExportWizard.tsx', 'TemplateEditor.tsx'],
    hooks: [],
    services: ['documentComposerService.ts'],
    userFlow: [
      'User selects issues for export',
      'Chooses or creates document template',
      'Configures header, footer, sections',
      'Previews document layout',
      'Generates document (PDF, DOCX)',
      'Downloads or shares document'
    ],
    roles: {
      admin: ['Create/edit templates', 'Configure default templates', 'Access all exports'],
      user: ['Use existing templates', 'Generate personal exports', 'View export history']
    },
    preconditions: ['Issues selected', 'Template available', 'Export permission granted'],
    postconditions: ['Document is generated', 'Export is logged', 'File is available for download'],
    edgeCases: ['Large document generation', 'Image embedding', 'Classification watermarks', 'Template variable resolution'],
    associatedDiagrams: ['data-flow'],
    apiDocumentation: [
      { method: 'GET', path: '/api/document-templates', description: 'List document templates', authentication: 'required', responseBody: 'DocumentTemplate[]' },
      { method: 'POST', path: '/api/document-templates', description: 'Create document template', authentication: 'required', requestBody: 'DocumentTemplate', responseBody: 'DocumentTemplate' },
      { method: 'POST', path: '/api/documents/generate', description: 'Generate document from issues', authentication: 'required', requestBody: '{ templateId, issueIds, format }', responseBody: '{ jobId }' },
      { method: 'GET', path: '/api/documents/:id/download', description: 'Download generated document', authentication: 'required', responseBody: 'Binary file' }
    ],
    implementationDetails: [
      { area: 'Template Engine', description: 'Variable substitution with conditional sections', status: 'implemented' },
      { area: 'PDF Generation', description: 'Server-side PDF generation with styling', status: 'implemented' },
      { area: 'DOCX Generation', description: 'Word document generation', status: 'partial' },
      { area: 'Watermarking', description: 'Classification-based watermarks', status: 'implemented' }
    ]
  },
  {
    id: 'structured-data',
    name: 'Structured Data Blocks',
    description: 'Custom data schemas and matrix views',
    purpose: 'Define custom data structures for specialized data capture beyond standard fields.',
    components: ['DataMatrixView.tsx', 'SchemaEditor.tsx', 'StructuredDataBlocks.tsx'],
    hooks: [],
    services: ['structuredDataService.ts'],
    userFlow: [
      'Admin creates data block schema',
      'Defines columns with types and validation',
      'Associates schema with project/issue type',
      'Users add data block instances to issues',
      'Data is entered in matrix format',
      'Data is searchable and reportable'
    ],
    roles: {
      admin: ['Create/edit schemas', 'Manage schema versions', 'Configure validation'],
      user: ['Add/edit data block instances', 'View structured data']
    },
    preconditions: ['Schema defined', 'Context assigned', 'Validation rules valid'],
    postconditions: ['Data block created', 'Data validated', 'Instance saved'],
    edgeCases: ['Schema version migration', 'Column type changes', 'Required column addition', 'Large matrix performance'],
    associatedDiagrams: ['core-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/data-schemas', description: 'List data block schemas', authentication: 'required', responseBody: 'DataBlockSchema[]' },
      { method: 'POST', path: '/api/data-schemas', description: 'Create data block schema', authentication: 'required', requestBody: '{ name, columns, validationRules }', responseBody: 'DataBlockSchema' },
      { method: 'GET', path: '/api/issues/:id/data-blocks', description: 'Get data blocks for an issue', authentication: 'required', responseBody: 'DataBlockInstance[]' },
      { method: 'POST', path: '/api/issues/:id/data-blocks', description: 'Add data block instance', authentication: 'required', requestBody: '{ schemaId, rows }', responseBody: 'DataBlockInstance' }
    ],
    implementationDetails: [
      { area: 'Schema Editor', description: 'Visual schema builder with type selection', status: 'implemented' },
      { area: 'Matrix View', description: 'Spreadsheet-like data entry interface', status: 'implemented' },
      { area: 'Validation', description: 'Row-level validation based on schema rules', status: 'implemented' },
      { area: 'Versioning', description: 'Schema versioning with migration support', status: 'partial' }
    ]
  },
  {
    id: 'guided-operations',
    name: 'Guided Operations',
    description: 'Step-by-step operation wizards',
    purpose: 'Guide users through complex multi-step operations with validation and rollback support.',
    components: ['GuidedOperations.tsx'],
    hooks: [],
    services: ['guidedOperationsService.ts'],
    userFlow: [
      'User initiates guided operation',
      'Views operation overview and steps',
      'Completes each step with validation',
      'Reviews changes before confirmation',
      'Operation executes with progress',
      'Results are displayed with rollback option'
    ],
    roles: {
      admin: ['Create operation definitions', 'Configure step requirements', 'Manage approvals'],
      user: ['Execute available operations', 'View execution history']
    },
    preconditions: ['Operation defined', 'User has execution permission', 'Prerequisites met'],
    postconditions: ['Operation completed', 'Results logged', 'Rollback available if supported'],
    edgeCases: ['Step failure recovery', 'Timeout handling', 'Concurrent execution prevention', 'Approval workflow'],
    associatedDiagrams: ['data-flow'],
    apiDocumentation: [
      { method: 'GET', path: '/api/guided-operations', description: 'List available operations', authentication: 'required', responseBody: 'GuidedOperation[]' },
      { method: 'POST', path: '/api/guided-operations/:id/start', description: 'Start operation execution', authentication: 'required', responseBody: 'OperationExecution' },
      { method: 'POST', path: '/api/guided-operations/executions/:id/step', description: 'Complete a step', authentication: 'required', requestBody: '{ stepData }', responseBody: 'OperationExecution' },
      { method: 'POST', path: '/api/guided-operations/executions/:id/rollback', description: 'Rollback operation', authentication: 'required', responseBody: 'OperationExecution' }
    ],
    implementationDetails: [
      { area: 'Operation Definition', description: 'JSON-based operation step configuration', status: 'implemented' },
      { area: 'Step Validation', description: 'Per-step validation before proceeding', status: 'implemented' },
      { area: 'Progress Tracking', description: 'Real-time execution progress updates', status: 'implemented' },
      { area: 'Rollback Support', description: 'Undo completed operations when possible', status: 'partial' }
    ]
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Advanced issue search and filtering',
    purpose: 'Find issues across projects using various filters and search criteria.',
    components: ['IssueSearchView.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'User navigates to Search page',
      'Enters search query or selects filters',
      'Results are displayed in list format',
      'User can sort and refine results',
      'Clicking issue opens detail view',
      'Search can be saved for reuse'
    ],
    roles: {
      admin: ['Search all issues', 'Save global filters'],
      user: ['Search accessible issues', 'Save personal filters']
    },
    preconditions: ['Issue access permissions', 'Valid search criteria'],
    postconditions: ['Results returned', 'Search is logged', 'Saved filter stored'],
    edgeCases: ['Empty results handling', 'Large result set pagination', 'Complex query performance', 'Permission filtering'],
    associatedDiagrams: ['data-flow'],
    apiDocumentation: [
      { method: 'GET', path: '/api/search/issues', description: 'Search issues with filters', authentication: 'required', responseBody: '{ data: Issue[], total: number, facets? }' },
      { method: 'POST', path: '/api/search/filters', description: 'Save a search filter', authentication: 'required', requestBody: '{ name, query, isGlobal? }', responseBody: 'SavedFilter' },
      { method: 'GET', path: '/api/search/filters', description: 'List saved filters', authentication: 'required', responseBody: 'SavedFilter[]' },
      { method: 'GET', path: '/api/search/suggestions', description: 'Get search suggestions', authentication: 'required', responseBody: 'Suggestion[]' }
    ],
    implementationDetails: [
      { area: 'Full-text Search', description: 'PostgreSQL full-text search with ranking', status: 'implemented' },
      { area: 'Filter Builder', description: 'Visual filter builder with field selection', status: 'implemented' },
      { area: 'Saved Filters', description: 'Personal and global saved searches', status: 'implemented' },
      { area: 'Search History', description: 'Recent search history', status: 'partial' }
    ]
  },
  {
    id: 'statuses',
    name: 'Status Management',
    description: 'Issue status configuration',
    purpose: 'Define and manage issue statuses used across workflows.',
    components: ['StatusManager.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Admin navigates to Status settings',
      'Views existing statuses',
      'Creates new status with name and category',
      'Assigns color and description',
      'Status is available for workflows',
      'Status appears on issues'
    ],
    roles: {
      admin: ['Create/edit statuses', 'Set status categories', 'Delete unused statuses'],
      user: ['Cannot manage statuses']
    },
    preconditions: ['Admin permission required', 'Unique status name'],
    postconditions: ['Status created', 'Available in workflow editor', 'Color is applied'],
    edgeCases: ['Status in use deletion prevention', 'Category change impact', 'Status migration'],
    associatedDiagrams: ['issue-lifecycle'],
    apiDocumentation: [
      { method: 'GET', path: '/api/statuses', description: 'List all statuses', authentication: 'required', responseBody: 'IssueStatus[]' },
      { method: 'POST', path: '/api/statuses', description: 'Create a new status', authentication: 'required', requestBody: '{ name, category, color, description? }', responseBody: 'IssueStatus' },
      { method: 'PUT', path: '/api/statuses/:id', description: 'Update status', authentication: 'required', requestBody: '{ name?, category?, color? }', responseBody: 'IssueStatus' },
      { method: 'DELETE', path: '/api/statuses/:id', description: 'Delete status (if unused)', authentication: 'required', responseBody: '{ success: boolean }' }
    ],
    implementationDetails: [
      { area: 'Status Categories', description: 'To Do, In Progress, Done categories', status: 'implemented' },
      { area: 'Color Coding', description: 'Customizable status colors', status: 'implemented' },
      { area: 'Usage Tracking', description: 'Track status usage before deletion', status: 'implemented' }
    ]
  },
  {
    id: 'versions',
    name: 'Versions & Releases',
    description: 'Version tracking and release management',
    purpose: 'Track software versions, plan releases, and associate issues with versions.',
    components: [],
    hooks: ['useVersions.ts'],
    services: [],
    userFlow: [
      'Admin creates version for project',
      'Sets version name and dates',
      'Issues are assigned to version',
      'Version progress is tracked',
      'Version is released',
      'Release notes can be generated'
    ],
    roles: {
      admin: ['Create/edit versions', 'Release versions', 'Archive versions'],
      user: ['View versions', 'Assign issues to versions']
    },
    preconditions: ['Project exists', 'Unique version name within project'],
    postconditions: ['Version created', 'Issues can be assigned', 'Progress is calculated'],
    edgeCases: ['Version date conflicts', 'Released version modification', 'Merge versions'],
    associatedDiagrams: ['core-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/projects/:id/versions', description: 'List versions for a project', authentication: 'required', responseBody: 'Version[]' },
      { method: 'POST', path: '/api/versions', description: 'Create a new version', authentication: 'required', requestBody: '{ projectId, name, startDate?, releaseDate?, description? }', responseBody: 'Version' },
      { method: 'PUT', path: '/api/versions/:id/release', description: 'Release a version', authentication: 'required', responseBody: 'Version' },
      { method: 'GET', path: '/api/versions/:id/release-notes', description: 'Generate release notes', authentication: 'required', responseBody: '{ markdown: string, issues: Issue[] }' }
    ],
    implementationDetails: [
      { area: 'Version States', description: 'Unreleased, Released, Archived states', status: 'implemented' },
      { area: 'Progress Tracking', description: 'Issue completion percentage per version', status: 'implemented' },
      { area: 'Release Notes', description: 'Auto-generated release notes from issues', status: 'partial' },
      { area: 'Version Burndown', description: 'Burndown chart for version progress', status: 'implemented' }
    ]
  },
  {
    id: 'components',
    name: 'Components',
    description: 'Project component organization',
    purpose: 'Organize issues by logical components or areas of the system.',
    components: [],
    hooks: ['useComponents.ts'],
    services: [],
    userFlow: [
      'Admin creates component in project',
      'Assigns component lead and description',
      'Issues are tagged with components',
      'Component-based filtering and reporting',
      'Default assignee can be set per component'
    ],
    roles: {
      admin: ['Create/edit components', 'Assign component leads', 'Archive components'],
      user: ['View components', 'Assign issues to components']
    },
    preconditions: ['Project exists', 'Unique component name within project'],
    postconditions: ['Component created', 'Issues can be tagged', 'Lead is assigned'],
    edgeCases: ['Component deletion with issues', 'Lead user removal', 'Component merge'],
    associatedDiagrams: ['core-erd'],
    apiDocumentation: [
      { method: 'GET', path: '/api/projects/:id/components', description: 'List components for a project', authentication: 'required', responseBody: 'Component[]' },
      { method: 'POST', path: '/api/components', description: 'Create a new component', authentication: 'required', requestBody: '{ projectId, name, description?, leadId?, defaultAssigneeType? }', responseBody: 'Component' },
      { method: 'PUT', path: '/api/components/:id', description: 'Update component', authentication: 'required', requestBody: '{ name?, description?, leadId? }', responseBody: 'Component' },
      { method: 'GET', path: '/api/components/:id/issues', description: 'Get issues for a component', authentication: 'required', responseBody: 'Issue[]' }
    ],
    implementationDetails: [
      { area: 'Component Lead', description: 'Assign a lead user per component', status: 'implemented' },
      { area: 'Default Assignee', description: 'Auto-assign issues based on component', status: 'implemented' },
      { area: 'Component Filtering', description: 'Filter boards and reports by component', status: 'implemented' }
    ]
  }
];
