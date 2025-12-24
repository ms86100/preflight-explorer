import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Archive, History, TrendingUp, Target, Calendar } from 'lucide-react';
import { useCompletedSprints } from '../hooks/useCompletedSprints';
import { SprintCardContent } from './SprintCardContent';

interface SprintHistoryPageProps {
  readonly boardId: string;
  readonly projectKey: string;
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

  // Calculate aggregate statistics
  const aggregateStats = sprints?.reduce(
    (acc, sprint) => ({
      totalSprints: acc.totalSprints + 1,
      totalIssues: acc.totalIssues + sprint.stats.totalIssues,
      completedIssues: acc.completedIssues + sprint.stats.completedIssues,
      totalPoints: acc.totalPoints + sprint.stats.completedStoryPoints,
      avgCompletion: acc.avgCompletion + sprint.stats.completionRate,
    }),
    { totalSprints: 0, totalIssues: 0, completedIssues: 0, totalPoints: 0, avgCompletion: 0 }
  );

  const avgCompletionRate = aggregateStats && aggregateStats.totalSprints > 0
    ? Math.round(aggregateStats.avgCompletion / aggregateStats.totalSprints)
    : 0;

  const avgVelocity = aggregateStats && aggregateStats.totalSprints > 0
    ? Math.round(aggregateStats.totalPoints / aggregateStats.totalSprints)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <History className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Sprint History</h1>
          <p className="text-muted-foreground">
            Review completed sprints and team performance for {projectKey}
          </p>
        </div>
      </div>

      {/* Aggregate Stats */}
      {sprints && sprints.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Sprints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{aggregateStats?.totalSprints}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Avg Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{avgCompletionRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{avgVelocity}</div>
              <div className="text-xs text-muted-foreground">points/sprint</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Total Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{aggregateStats?.completedIssues}</div>
              <div className="text-xs text-muted-foreground">issues completed</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sprint List */}
      {!sprints?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Archive className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No Completed Sprints</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Once you complete your first sprint, you'll be able to review its performance,
              team contributions, and historical data here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {sprints.map((sprint) => (
            <SprintCardContent key={sprint.id} sprint={sprint} />
          ))}
        </Accordion>
      )}
    </div>
  );
}
