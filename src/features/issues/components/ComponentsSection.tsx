import { useState } from 'react';
import { useProjectComponents, useIssueComponents, useUpdateIssueComponents } from '@/features/components';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderKanban, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ComponentsSectionProps {
  readonly issueId: string;
  readonly projectId: string;
}

export function ComponentsSection({ issueId, projectId }: ComponentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: projectComponents, isLoading: isLoadingProject } = useProjectComponents(projectId);
  const { data: issueComponents, isLoading: isLoadingIssue } = useIssueComponents(issueId);
  const updateComponents = useUpdateIssueComponents();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // When popover opens, sync selected with current issue components
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedIds(issueComponents?.map(c => c.id) || []);
    }
    setIsOpen(open);
  };
  
  const handleToggle = (componentId: string) => {
    setSelectedIds(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };
  
  const handleSave = async () => {
    try {
      await updateComponents.mutateAsync({ issueId, componentIds: selectedIds });
      setIsOpen(false);
      toast.success('Components updated');
    } catch {
      toast.error('Failed to update components');
    }
  };
  
  const handleRemove = async (componentId: string) => {
    const newIds = (issueComponents?.map(c => c.id) || []).filter(id => id !== componentId);
    try {
      await updateComponents.mutateAsync({ issueId, componentIds: newIds });
      toast.success('Component removed');
    } catch {
      toast.error('Failed to remove component');
    }
  };
  
  const isLoading = isLoadingProject || isLoadingIssue;
  const activeComponents = projectComponents?.filter(c => !c.is_archived) || [];
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {issueComponents?.length === 0 ? (
          <span className="text-sm text-muted-foreground">None</span>
        ) : (
          issueComponents?.map(component => (
            <Badge key={component.id} variant="secondary" className="gap-1">
              <FolderKanban className="h-3 w-3" />
              {component.name}
              <button
                type="button"
                onClick={() => handleRemove(component.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Component
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Select Components</h4>
          </div>
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1">
              {activeComponents.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No components available</p>
              ) : (
                activeComponents.map(component => (
                  <label
                    key={component.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.includes(component.id)}
                      onCheckedChange={() => handleToggle(component.id)}
                    />
                    <FolderKanban className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1">{component.name}</span>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="p-2 border-t flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateComponents.isPending}>
              {updateComponents.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
