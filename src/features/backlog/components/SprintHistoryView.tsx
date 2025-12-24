import { Accordion } from '@/components/ui/accordion';
import { Loader2, Archive } from 'lucide-react';
import { useCompletedSprints } from '../hooks/useCompletedSprints';
import { SprintCardContent } from './SprintCardContent';

interface SprintHistoryViewProps {
  readonly boardId: string;
}

export function SprintHistoryView({ boardId }: SprintHistoryViewProps) {
  const { data: sprints, isLoading } = useCompletedSprints(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sprints?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Archive className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">No completed sprints yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete a sprint to see its history here
        </p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {sprints.map((sprint) => (
        <SprintCardContent key={sprint.id} sprint={sprint} />
      ))}
    </Accordion>
  );
}
