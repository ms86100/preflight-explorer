import { Clock, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BoardColumn } from './BoardColumn';
import { BoardToolbar } from './BoardToolbar';
import { useBoardState } from '../hooks/useBoardState';
import type { BoardIssue, BoardColumn as BoardColumnType, TeamMember } from '../types/board';

interface KanbanBoardProps {
  readonly projectKey: string;
  readonly projectName: string;
  readonly columns: readonly BoardColumnType[];
  readonly issues: readonly BoardIssue[];
  readonly teamMembers?: readonly TeamMember[];
  readonly onIssueMove?: (issueId: string, newStatus: string) => void;
  readonly onIssueSelect?: (issueId: string) => void;
  readonly onCreateIssue?: (status?: string) => void;
  readonly onOpenSettings?: () => void;
}

const DEFAULT_KANBAN_COLUMNS: BoardColumnType[] = [
  { id: 'backlog', name: 'Backlog', statusCategory: 'todo' },
  { id: 'selected', name: 'Selected for Development', statusCategory: 'todo', maxIssues: 10 },
  { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress', maxIssues: 5 },
  { id: 'review', name: 'In Review', statusCategory: 'in_progress', maxIssues: 3 },
  { id: 'done', name: 'Done', statusCategory: 'done' },
];

const getWipStatusClass = (wipStatus: 'normal' | 'warning' | 'exceeded'): string => {
  switch (wipStatus) {
    case 'exceeded':
      return 'bg-destructive/20 text-destructive';
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function KanbanBoard({
  projectKey = '',
  projectName = 'Project',
  columns = DEFAULT_KANBAN_COLUMNS,
  issues: initialIssues = [],
  teamMembers = [],
  onIssueMove,
  onIssueSelect,
  onCreateIssue,
  onOpenSettings,
}: Partial<KanbanBoardProps>) {
  const {
    searchQuery,
    setSearchQuery,
    selectedAssignees,
    isFullscreen,
    setIsFullscreen,
    issueStatusMap,
    validateDrop,
    issueInColumn,
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

  // Calculate Kanban metrics
  const metrics = {
    totalIssues: issues.length,
    wipIssues: issues.filter(i => 
      columns.find(c => issueInColumn(i, c))?.statusCategory === 'in_progress'
    ).length,
    completedThisWeek: issues.filter(i => {
      const col = columns.find(c => issueInColumn(i, c));
      if (col?.statusCategory !== 'done' || !i.updated_at) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(i.updated_at) >= weekAgo;
    }).length,
  };

  // Check WIP limit violations
  const getWipStatus = (column: BoardColumnType) => {
    const count = getColumnIssues(column).length;
    if (!column.maxIssues) return 'normal';
    if (count >= column.maxIssues) return 'exceeded';
    if (count >= column.maxIssues * 0.8) return 'warning';
    return 'normal';
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Kanban Header with Metrics */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">{projectName} Kanban Board</h2>
            <p className="text-sm text-muted-foreground">Continuous flow with WIP limits</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  <BarChart2 className="h-3 w-3 mr-1" />
                  WIP: {metrics.wipIssues}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  Completed this week: {metrics.completedThisWeek}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BoardToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedAssignees={selectedAssignees}
        onToggleAssignee={toggleAssignee}
        teamMembers={teamMembers}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onOpenSettings={onOpenSettings}
        settingsMenuItems={[{ label: 'Configure WIP limits', onClick: () => onOpenSettings?.() }]}
      />

      {/* Board Columns with WIP indicators */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            const wipStatus = getWipStatus(column);
            const columnIssues = getColumnIssues(column);
            const dropStatusId = column.statusIds?.[0] || column.id;
            const columnStatuses = getColumnStatuses(column);
            
            return (
              <div key={column.id} className="flex flex-col">
                {!!column.maxIssues && (
                  <div className={`text-xs text-center py-1 mb-1 rounded ${getWipStatusClass(wipStatus)}`}>
                    {columnIssues.length}/{column.maxIssues} WIP
                  </div>
                )}
                <BoardColumn
                  id={dropStatusId}
                  name={column.name}
                  issues={columnIssues}
                  statusCategory={column.statusCategory}
                  maxIssues={column.maxIssues}
                  statuses={columnStatuses}
                  issueStatusMap={issueStatusMap}
                  onIssueSelect={onIssueSelect}
                  onCreateIssue={() => onCreateIssue?.(dropStatusId)}
                  onDrop={handleIssueDrop}
                  onValidateDrop={validateDrop}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
