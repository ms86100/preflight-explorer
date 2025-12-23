import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import {
  Accordion,
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
  Loader2,
  Archive,
  BarChart3,
} from 'lucide-react';

interface SprintWithDetails {
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

interface SprintIssue {
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

interface Contributor {
  id: string;
  name: string;
  avatar_url: string | null;
  issuesCompleted: number;
  storyPointsCompleted: number;
}

interface SprintStats {
  totalIssues: number;
  completedIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completionRate: number;
  durationDays: number;
}

interface SprintHistoryItem {
  id: string;
  action: string;
  actor_name: string | null;
  issue_key: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface SprintHistoryPageProps {
  readonly boardId: string;
  readonly projectKey: string;
}

function useCompletedSprints(boardId: string) {
  return useQuery({
    queryKey: ['completed-sprints-detailed', boardId],
    queryFn: async (): Promise<SprintWithDetails[]> => {
      const { data: sprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .eq('board_id', boardId)
        .eq('state', 'closed')
        .order('completed_date', { ascending: false });

      if (sprintsError) throw sprintsError;
      if (!sprints?.length) return [];

      const detailedSprints: SprintWithDetails[] = [];

      for (const sprint of sprints) {
        const { data: sprintIssues } = await supabase
          .from('sprint_issues')
          .select(`
            issue_id,
            issues (
              id,
              issue_key,
              summary,
              assignee_id,
              story_points,
              issue_types:issue_type_id (name),
              issue_statuses:status_id (name, category, color)
            )
          `)
          .eq('sprint_id', sprint.id);

        const issues: SprintIssue[] = (sprintIssues || []).map((si: {
          issue_id: string;
          issues: {
            id: string;
            issue_key: string;
            summary: string;
            assignee_id: string | null;
            story_points: number | null;
            issue_types: { name: string } | null;
            issue_statuses: { name: string; category: string; color: string | null } | null;
          } | null
        }) => ({
          id: si.issues?.id || si.issue_id,
          issue_key: si.issues?.issue_key || 'Unknown',
          summary: si.issues?.summary || '',
          status_name: si.issues?.issue_statuses?.name || 'Unknown',
          status_category: si.issues?.issue_statuses?.category || 'todo',
          status_color: si.issues?.issue_statuses?.color || null,
          assignee_id: si.issues?.assignee_id || null,
          assignee_name: null,
          issue_type_name: si.issues?.issue_types?.name || 'Task',
          story_points: si.issues?.story_points || null,
        }));

        const assigneeIds = [...new Set(issues.filter(i => i.assignee_id).map(i => i.assignee_id))] as string[];
        if (assigneeIds.length > 0) {
          const { data: profiles } = await supabase.rpc('get_public_profiles', {
            _user_ids: assigneeIds,
          });
          const profileMap = new Map((profiles || []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
          issues.forEach(issue => {
            if (issue.assignee_id) {
              issue.assignee_name = profileMap.get(issue.assignee_id) || null;
            }
          });
        }

        const contributorMap = new Map<string, Contributor>();
        issues.forEach(issue => {
          if (issue.assignee_id && issue.status_category === 'done') {
            const existing = contributorMap.get(issue.assignee_id);
            if (existing) {
              existing.issuesCompleted++;
              existing.storyPointsCompleted += issue.story_points || 0;
            } else {
              contributorMap.set(issue.assignee_id, {
                id: issue.assignee_id,
                name: issue.assignee_name || 'Unknown',
                avatar_url: null,
                issuesCompleted: 1,
                storyPointsCompleted: issue.story_points || 0,
              });
            }
          }
        });

        const completedIssues = issues.filter(i => i.status_category === 'done');
        const totalStoryPoints = issues.reduce((sum, i) => sum + (i.story_points || 0), 0);
        const completedStoryPoints = completedIssues.reduce((sum, i) => sum + (i.story_points || 0), 0);
        const durationDays = sprint.start_date && sprint.completed_date
          ? differenceInDays(new Date(sprint.completed_date), new Date(sprint.start_date))
          : 0;

        const stats: SprintStats = {
          totalIssues: issues.length,
          completedIssues: completedIssues.length,
          totalStoryPoints,
          completedStoryPoints,
          completionRate: issues.length > 0 ? Math.round((completedIssues.length / issues.length) * 100) : 0,
          durationDays,
        };

        const { data: historyData } = await supabase
          .from('sprint_history')
          .select('*')
          .eq('sprint_id', sprint.id)
          .order('created_at', { ascending: true });

        const historyActorIds = [...new Set((historyData || []).filter(h => h.actor_id).map(h => h.actor_id))] as string[];
        let historyActorMap = new Map<string, string>();
        if (historyActorIds.length > 0) {
          const { data: actorProfiles } = await supabase.rpc('get_public_profiles', {
            _user_ids: historyActorIds,
          });
          historyActorMap = new Map((actorProfiles || []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
        }

        const history: SprintHistoryItem[] = (historyData || []).map(h => ({
          id: h.id,
          action: h.action,
          actor_name: h.actor_id ? historyActorMap.get(h.actor_id) || 'Unknown' : null,
          issue_key: h.issue_key,
          created_at: h.created_at,
          metadata: h.metadata as Record<string, unknown> | null,
        }));

        detailedSprints.push({
          ...sprint,
          issues,
          contributors: Array.from(contributorMap.values()).sort((a, b) => b.issuesCompleted - a.issuesCompleted),
          stats,
          history,
        });
      }

      return detailedSprints;
    },
    enabled: !!boardId,
  });
}

function SprintCard({ sprint }: { readonly sprint: SprintWithDetails }) {
  const getActionDescription = (item: SprintHistoryItem) => {
    switch (item.action) {
      case 'created':
        return `${item.actor_name || 'Someone'} created the sprint`;
      case 'started':
        return `${item.actor_name || 'Someone'} started the sprint with ${item.metadata?.issue_count || 0} issues`;
      case 'completed':
        return `${item.actor_name || 'Someone'} completed the sprint - ${item.metadata?.completed_issues || 0}/${item.metadata?.total_issues || 0} done`;
      case 'issue_added':
        return `${item.actor_name || 'Someone'} added ${item.issue_key}`;
      case 'issue_removed':
        return `${item.actor_name || 'Someone'} removed ${item.issue_key}`;
      case 'edited':
        return `${item.actor_name || 'Someone'} edited sprint details`;
      default:
        return `${item.actor_name || 'Someone'} performed an action`;
    }
  };

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

export function SprintHistoryPage({ boardId, projectKey }: SprintHistoryPageProps) {
  const { data: sprints, isLoading } = useCompletedSprints(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sprints?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Archive className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h3 className="text-lg font-semibold mb-2">No Completed Sprints</h3>
        <p className="text-muted-foreground max-w-md">
          When you complete sprints, they'll appear here with full details including issues, 
          team contributions, and activity timeline.
        </p>
      </div>
    );
  }

  const totalIssuesCompleted = sprints.reduce((sum, s) => sum + s.stats.completedIssues, 0);
  const totalStoryPoints = sprints.reduce((sum, s) => sum + s.stats.completedStoryPoints, 0);
  const avgCompletionRate = Math.round(sprints.reduce((sum, s) => sum + s.stats.completionRate, 0) / sprints.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Sprints</div>
            <div className="text-3xl font-bold">{sprints.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Issues Completed</div>
            <div className="text-3xl font-bold text-green-600">{totalIssuesCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Velocity</div>
            <div className="text-3xl font-bold text-blue-600">{totalStoryPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Avg Completion</div>
            <div className="text-3xl font-bold text-purple-600">{avgCompletionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {sprints.map(sprint => (
          <SprintCard key={sprint.id} sprint={sprint} />
        ))}
      </Accordion>
    </div>
  );
}
