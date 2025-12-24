import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BoardColumn } from './BoardColumn';
import { BoardToolbar } from './BoardToolbar';
import { useBoardState } from '../hooks/useBoardState';
import type { BoardIssue, BoardColumn as BoardColumnType, TeamMember } from '../types/board';

interface BasicBoardProps {
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

const DEFAULT_BASIC_COLUMNS: BoardColumnType[] = [
  { id: 'todo', name: 'To Do', statusCategory: 'todo' },
  { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress' },
  { id: 'done', name: 'Done', statusCategory: 'done' },
];

export function BasicBoard({
  projectKey = '',
  projectName = 'Project',
  columns = DEFAULT_BASIC_COLUMNS,
  issues: initialIssues = [],
  teamMembers = [],
  onIssueMove,
  onIssueSelect,
  onCreateIssue,
  onOpenSettings,
}: Partial<BasicBoardProps>) {
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

  const stats = {
    total: issues.length,
    todo: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'todo').length,
    inProgress: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'in_progress').length,
    done: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'done').length,
  };
  
  const progressPercentage = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{projectName}</h2>
            <p className="text-sm text-muted-foreground">Task Management Board</p>
          </div>
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Project Progress</span>
                <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2 mb-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Circle className="h-3 w-3" />{stats.todo} To Do</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" />{stats.inProgress} In Progress</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{stats.done} Done</span>
              </div>
            </CardContent>
          </Card>
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
        rightContent={
          <Button onClick={() => onCreateIssue?.()} size="sm">
            <Plus className="h-4 w-4 mr-1" />Add Task
          </Button>
        }
      />

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
