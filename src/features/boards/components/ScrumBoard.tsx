import { SprintHeader } from './SprintHeader';
import { BoardColumn } from './BoardColumn';
import { BoardToolbar } from './BoardToolbar';
import { useBoardState } from '../hooks/useBoardState';
import type { BoardIssue, BoardColumn as BoardColumnType, TeamMember } from '../types/board';
import type { SprintState } from '@/types/jira';

interface ScrumBoardProps {
  readonly projectKey: string;
  readonly projectName: string;
  readonly sprint?: {
    readonly id: string;
    readonly name: string;
    readonly goal?: string;
    readonly state: SprintState;
    readonly start_date?: string;
    readonly end_date?: string;
  };
  readonly columns: readonly BoardColumnType[];
  readonly issues: readonly BoardIssue[];
  readonly statusCategoryMap?: ReadonlyMap<string, string>;
  readonly teamMembers?: readonly TeamMember[];
  readonly onIssueMove?: (issueId: string, newStatus: string) => void;
  readonly onIssueSelect?: (issueId: string) => void;
  readonly onCreateIssue?: (status?: string) => void;
  readonly onOpenSettings?: () => void;
}

const DEFAULT_COLUMNS: BoardColumnType[] = [
  { id: 'todo', name: 'To Do', statusCategory: 'todo' },
  { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress', maxIssues: 5 },
  { id: 'done', name: 'Done', statusCategory: 'done' },
];

export function ScrumBoard({
  projectKey = '',
  projectName = 'Project',
  sprint,
  columns = DEFAULT_COLUMNS,
  issues: initialIssues = [],
  teamMembers = [],
  statusCategoryMap,
  onIssueMove,
  onIssueSelect,
  onCreateIssue,
  onOpenSettings,
}: Partial<ScrumBoardProps>) {
  const {
    searchQuery,
    setSearchQuery,
    selectedAssignees,
    isFullscreen,
    setIsFullscreen,
    issueStatusMap,
    validateDrop,
    getColumnIssues,
    handleIssueDrop,
    toggleAssignee,
    getColumnStatuses,
    issues,
  } = useBoardState({
    initialIssues,
    columns,
    onIssueMove,
  });

  // Helper to check if an issue is done (by status category)
  const isIssueDone = (issue: BoardIssue): boolean => {
    if (statusCategoryMap) {
      return statusCategoryMap.get(issue.status) === 'done';
    }
    return issue.status === 'done';
  };

  // Calculate sprint stats
  const sprintStats = {
    totalIssues: issues.length,
    completedIssues: issues.filter(isIssueDone).length,
    totalPoints: issues.reduce((sum, i) => sum + (i.story_points || 0), 0),
    completedPoints: issues
      .filter(isIssueDone)
      .reduce((sum, i) => sum + (i.story_points || 0), 0),
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <BoardToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedAssignees={selectedAssignees}
        onToggleAssignee={toggleAssignee}
        teamMembers={teamMembers}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onOpenSettings={onOpenSettings}
        settingsMenuItems={[{ label: 'Configure columns', onClick: () => onOpenSettings?.() }]}
      />

      {/* Sprint Header */}
      {sprint && (
        <div className="p-4 bg-muted/30">
          <SprintHeader sprint={sprint} stats={sprintStats} />
        </div>
      )}

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            const dropStatusId = column.statusIds?.[0] || column.id;
            const columnStatuses = getColumnStatuses(column);
            return (
              <BoardColumn
                key={column.id}
                id={dropStatusId}
                name={column.name}
                issues={getColumnIssues(column)}
                statusCategory={column.statusCategory}
                maxIssues={column.maxIssues}
                statuses={columnStatuses}
                issueStatusMap={issueStatusMap}
                onIssueSelect={onIssueSelect}
                onCreateIssue={() => onCreateIssue?.(dropStatusId)}
                onDrop={handleIssueDrop}
                onValidateDrop={validateDrop}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
