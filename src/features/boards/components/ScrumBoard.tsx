import { useState, useCallback } from 'react';
import { Filter, Search, MoreHorizontal, User, Tag, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SprintHeader } from './SprintHeader';
import { BoardColumn } from './BoardColumn';
import type { ClassificationLevel, SprintState } from '@/types/jira';

interface BoardIssue {
  id: string;
  issue_key: string;
  summary: string;
  issue_type: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Subtask';
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  status: string;
  assignee?: {
    display_name: string;
    avatar_url?: string;
  };
  story_points?: number;
  classification?: ClassificationLevel;
  labels?: string[];
  epic_name?: string;
  epic_color?: string;
}

interface ScrumBoardProps {
  projectKey: string;
  projectName: string;
  sprint?: {
    id: string;
    name: string;
    goal?: string;
    state: SprintState;
    start_date?: string;
    end_date?: string;
  };
  columns: {
    id: string;
    name: string;
    statusCategory: 'todo' | 'in_progress' | 'done';
    maxIssues?: number;
  }[];
  issues: BoardIssue[];
  teamMembers?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  }[];
  onIssueMove?: (issueId: string, newStatus: string) => void;
  onIssueSelect?: (issueId: string) => void;
  onCreateIssue?: (status?: string) => void;
}

// Mock data for demo
const MOCK_COLUMNS = [
  { id: 'todo', name: 'To Do', statusCategory: 'todo' as const },
  { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress' as const, maxIssues: 5 },
  { id: 'in_review', name: 'In Review', statusCategory: 'in_progress' as const, maxIssues: 3 },
  { id: 'done', name: 'Done', statusCategory: 'done' as const },
];

const MOCK_ISSUES: BoardIssue[] = [
  {
    id: '1',
    issue_key: 'MRTT-101',
    summary: 'Implement secure data transmission protocol for avionics interface',
    issue_type: 'Story',
    priority: 'High',
    status: 'todo',
    assignee: { display_name: 'Sagar Sharma' },
    story_points: 8,
    classification: 'export_controlled',
    epic_name: 'Avionics Integration',
    epic_color: '#8777d9',
  },
  {
    id: '2',
    issue_key: 'MRTT-102',
    summary: 'Security audit for export control compliance',
    issue_type: 'Task',
    priority: 'Highest',
    status: 'in_progress',
    assignee: { display_name: 'John Doe' },
    story_points: 5,
    classification: 'confidential',
    labels: ['security', 'audit'],
  },
  {
    id: '3',
    issue_key: 'MRTT-103',
    summary: 'Fix data validation bug in flight parameter module',
    issue_type: 'Bug',
    priority: 'High',
    status: 'in_progress',
    assignee: { display_name: 'Jane Smith' },
    story_points: 3,
    classification: 'restricted',
  },
  {
    id: '4',
    issue_key: 'MRTT-104',
    summary: 'Update documentation for CCB review',
    issue_type: 'Task',
    priority: 'Medium',
    status: 'in_review',
    assignee: { display_name: 'Sagar Sharma' },
    story_points: 2,
    classification: 'restricted',
  },
  {
    id: '5',
    issue_key: 'MRTT-100',
    summary: 'Initial project setup and CI/CD pipeline',
    issue_type: 'Task',
    priority: 'Medium',
    status: 'done',
    assignee: { display_name: 'John Doe' },
    story_points: 3,
    classification: 'restricted',
  },
  {
    id: '6',
    issue_key: 'MRTT-105',
    summary: 'Design system architecture for real-time monitoring',
    issue_type: 'Story',
    priority: 'Medium',
    status: 'todo',
    story_points: 13,
    classification: 'export_controlled',
    epic_name: 'Monitoring System',
    epic_color: '#36b37e',
  },
];

const MOCK_SPRINT = {
  id: 'sprint-1',
  name: 'Sprint 12',
  goal: 'Complete avionics integration phase 1 and pass security audit',
  state: 'active' as SprintState,
  start_date: '2024-01-08',
  end_date: '2024-01-22',
};

const MOCK_TEAM = [
  { id: '1', display_name: 'Sagar Sharma' },
  { id: '2', display_name: 'John Doe' },
  { id: '3', display_name: 'Jane Smith' },
];

export function ScrumBoard({
  projectKey = 'MRTT',
  projectName = 'MRTT Program',
  sprint = MOCK_SPRINT,
  columns = MOCK_COLUMNS,
  issues: initialIssues = MOCK_ISSUES,
  teamMembers = MOCK_TEAM,
  onIssueMove,
  onIssueSelect,
  onCreateIssue,
}: Partial<ScrumBoardProps>) {
  const [issues, setIssues] = useState(initialIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate sprint stats
  const sprintStats = {
    totalIssues: issues.length,
    completedIssues: issues.filter((i) => i.status === 'done').length,
    totalPoints: issues.reduce((sum, i) => sum + (i.story_points || 0), 0),
    completedPoints: issues
      .filter((i) => i.status === 'done')
      .reduce((sum, i) => sum + (i.story_points || 0), 0),
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      !searchQuery ||
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issue_key.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAssignee =
      selectedAssignees.length === 0 ||
      (issue.assignee && selectedAssignees.includes(issue.assignee.display_name));

    return matchesSearch && matchesAssignee;
  });

  // Get issues by column
  const getColumnIssues = useCallback(
    (columnId: string) => filteredIssues.filter((issue) => issue.status === columnId),
    [filteredIssues]
  );

  // Handle drag and drop
  const handleIssueDrop = (issueId: string, columnId: string) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === issueId ? { ...issue, status: columnId } : issue))
    );
    onIssueMove?.(issueId, columnId);
  };

  // Toggle assignee filter
  const toggleAssignee = (name: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Board Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {/* Team Avatars Filter */}
          <div className="flex items-center gap-1">
            {teamMembers?.map((member) => {
              const isSelected = selectedAssignees.includes(member.display_name);
              const initials = member.display_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              return (
                <button
                  key={member.id}
                  onClick={() => toggleAssignee(member.display_name)}
                  className={`rounded-full transition-all ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button className="quick-filter quick-filter-inactive">
              <Filter className="h-3.5 w-3.5 mr-1" />
              Only My Issues
            </button>
            <button className="quick-filter quick-filter-inactive">
              Recently Updated
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Board settings</DropdownMenuItem>
              <DropdownMenuItem>Configure columns</DropdownMenuItem>
              <DropdownMenuItem>Quick filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sprint Header */}
      {sprint && (
        <div className="p-4 bg-muted/30">
          <SprintHeader sprint={sprint} stats={sprintStats} />
        </div>
      )}

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              id={column.id}
              name={column.name}
              issues={getColumnIssues(column.id)}
              statusCategory={column.statusCategory}
              maxIssues={column.maxIssues}
              onIssueSelect={onIssueSelect}
              onCreateIssue={() => onCreateIssue?.(column.id)}
              onDrop={handleIssueDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
