import { format } from 'date-fns';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Calendar,
  Target,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import type { SprintWithDetails, SprintHistoryItem } from '../types/sprint';

export function getActionDescription(item: SprintHistoryItem): string {
  const actor = item.actor_name || 'Someone';
  switch (item.action) {
    case 'created':
      return `${actor} created the sprint`;
    case 'started':
      return `${actor} started the sprint with ${item.metadata?.issue_count || 0} issues`;
    case 'completed':
      return `${actor} completed the sprint - ${item.metadata?.completed_issues || 0}/${item.metadata?.total_issues || 0} done`;
    case 'issue_added':
      return `${actor} added ${item.issue_key}`;
    case 'issue_removed':
      return `${actor} removed ${item.issue_key}`;
    case 'edited':
      return `${actor} edited sprint details`;
    default:
      return `${actor} performed an action`;
  }
}

interface SprintCardContentProps {
  readonly sprint: SprintWithDetails;
  readonly variant?: 'compact' | 'full';
}

export function SprintCardContent({ sprint, variant = 'full' }: SprintCardContentProps) {
  return (
    <AccordionItem value={sprint.id} className="border rounded-lg mb-4 overflow-hidden bg-card">
      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">{sprint.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {sprint.start_date && format(new Date(sprint.start_date), 'MMM d')}
                <ArrowRight className="h-3 w-3" />
                {sprint.completed_date && format(new Date(sprint.completed_date), 'MMM d, yyyy')}
                <span className="mx-1">•</span>
                <span>{sprint.stats.durationDays} days</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">{sprint.stats.completionRate}%</div>
              <div className="text-xs text-muted-foreground">Completion</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{sprint.stats.completedIssues}/{sprint.stats.totalIssues}</div>
              <div className="text-xs text-muted-foreground">Issues</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{sprint.stats.completedStoryPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        {sprint.goal && (
          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Target className="h-4 w-4 text-primary" />
              Sprint Goal
            </div>
            <p className="text-sm text-muted-foreground">{sprint.goal}</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{sprint.stats.completedIssues}</div>
              <div className="text-xs text-muted-foreground">issues done</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Spillover</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{sprint.stats.totalIssues - sprint.stats.completedIssues}</div>
              <div className="text-xs text-muted-foreground">incomplete</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Velocity</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{sprint.stats.completedStoryPoints}</div>
              <div className="text-xs text-muted-foreground">story points</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Duration</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{sprint.stats.durationDays}</div>
              <div className="text-xs text-muted-foreground">days</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{sprint.stats.completionRate}%</span>
          </div>
          <Progress value={sprint.stats.completionRate} className="h-2" />
        </div>

        <Separator className="my-6" />

        {sprint.contributors.length > 0 && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm font-medium mb-4">
                <Users className="h-4 w-4 text-primary" />
                Team Contributions ({sprint.contributors.length})
              </div>
              <div className="grid grid-cols-3 gap-3">
                {sprint.contributors.map(contributor => (
                  <div key={contributor.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm font-medium">
                        {contributor.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{contributor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contributor.issuesCompleted} issues • {contributor.storyPointsCompleted} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator className="my-6" />
          </>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              Issues ({sprint.issues.length})
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {sprint.issues.map(issue => (
                <div
                  key={issue.id}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                    issue.status_category === 'done' ? 'bg-green-500/5 border border-green-500/20' : 'bg-orange-500/5 border border-orange-500/20'
                  }`}
                >
                  {issue.status_category === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                  )}
                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                    {issue.issue_key}
                  </Badge>
                  <span className="truncate flex-1">{issue.summary}</span>
                  {issue.story_points != null && issue.story_points > 0 && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {issue.story_points} pts
                    </Badge>
                  )}
                </div>
              ))}
              {sprint.issues.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No issues found
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <Clock className="h-4 w-4 text-primary" />
              Activity Timeline
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {sprint.history.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div>{getActionDescription(item)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
              {sprint.history.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No history recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
