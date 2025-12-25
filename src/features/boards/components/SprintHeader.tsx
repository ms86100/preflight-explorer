import { useState } from 'react';
import { Calendar, ChevronDown, Clock, Play, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SprintState } from '@/types/jira';

const getSprintStateLozengeClass = (state: SprintState): string => {
  switch (state) {
    case 'active':
      return 'lozenge-inprogress';
    case 'closed':
      return 'lozenge-success';
    default:
      return 'lozenge-default';
  }
};

const getDaysRemainingClassName = (daysRemaining: number): string => {
  if (daysRemaining < 0) return 'text-destructive';
  if (daysRemaining <= 2) return 'text-warning';
  return '';
};

const getDaysRemainingText = (daysRemaining: number): string => {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`;
  return `${daysRemaining} days left`;
};

interface SprintHeaderProps {
  readonly sprint: {
    readonly id: string;
    readonly name: string;
    readonly goal?: string;
    readonly state: SprintState;
    readonly start_date?: string;
    readonly end_date?: string;
  };
  readonly stats: {
    readonly totalIssues: number;
    readonly completedIssues: number;
    readonly totalPoints: number;
    readonly completedPoints: number;
  };
  readonly onStartSprint?: () => void;
  readonly onCompleteSprint?: () => void;
  readonly onEditSprint?: () => void;
}

export function SprintHeader({
  sprint,
  stats,
  onStartSprint,
  onCompleteSprint,
  onEditSprint,
}: SprintHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const progressPercent = stats.totalIssues > 0
    ? Math.round((stats.completedIssues / stats.totalIssues) * 100)
    : 0;

  const pointsPercent = stats.totalPoints > 0
    ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
    : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!sprint.end_date) return null;
    const end = new Date(sprint.end_date);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-card border border-border rounded-lg">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-3 md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </Button>
              </CollapsibleTrigger>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base md:text-lg font-semibold truncate">{sprint.name}</h2>
                  <span
                    className={`lozenge ${getSprintStateLozengeClass(sprint.state)} shrink-0`}
                  >
                    {sprint.state}
                  </span>
                </div>
                {sprint.goal && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{sprint.goal}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              {/* Sprint Dates */}
              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                  </span>
                </div>

                {sprint.state === 'active' && daysRemaining !== null && (
                  <div
                    className={`flex items-center gap-1 md:gap-1.5 ${getDaysRemainingClassName(daysRemaining)}`}
                  >
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                    <span className="whitespace-nowrap">{getDaysRemainingText(daysRemaining)}</span>
                  </div>
                )}
              </div>

              {/* Sprint Actions */}
              <div className="flex items-center gap-2">
                {sprint.state === 'future' && (
                  <Button size="sm" onClick={onStartSprint} className="text-xs md:text-sm">
                    <Play className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                    <span className="hidden sm:inline">Start Sprint</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                )}

                {sprint.state === 'active' && (
                  <Button size="sm" variant="outline" onClick={onCompleteSprint} className="text-xs md:text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                    <span className="hidden sm:inline">Complete Sprint</span>
                    <span className="sm:hidden">Complete</span>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEditSprint}>Edit sprint</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-border pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Issues Progress */}
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                  <span className="text-muted-foreground">Issues</span>
                  <span className="font-medium">
                    {stats.completedIssues} / {stats.totalIssues} ({progressPercent}%)
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Points Progress */}
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                  <span className="text-muted-foreground">Story Points</span>
                  <span className="font-medium">
                    {stats.completedPoints} / {stats.totalPoints} ({pointsPercent}%)
                  </span>
                </div>
                <Progress value={pointsPercent} className="h-2" />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
