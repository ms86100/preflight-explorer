import { useState } from 'react';
import { 
  useProjectVersions, 
  useIssueFixVersions, 
  useIssueAffectsVersions,
  useUpdateIssueFixVersions,
  useUpdateIssueAffectsVersions 
} from '@/features/versions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface VersionsSectionProps {
  readonly issueId: string;
  readonly projectId: string;
  readonly type: 'fix' | 'affects';
}

export function VersionsSection({ issueId, projectId, type }: VersionsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: projectVersions, isLoading: isLoadingProject } = useProjectVersions(projectId);
  const { data: fixVersions, isLoading: isLoadingFix } = useIssueFixVersions(issueId);
  const { data: affectsVersions, isLoading: isLoadingAffects } = useIssueAffectsVersions(issueId);
  const updateFixVersions = useUpdateIssueFixVersions();
  const updateAffectsVersions = useUpdateIssueAffectsVersions();
  
  const issueVersions = type === 'fix' ? fixVersions : affectsVersions;
  const updateVersions = type === 'fix' ? updateFixVersions : updateAffectsVersions;
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedIds(issueVersions?.map(v => v.id) || []);
    }
    setIsOpen(open);
  };
  
  const handleToggle = (versionId: string) => {
    setSelectedIds(prev => 
      prev.includes(versionId) 
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };
  
  const handleSave = async () => {
    try {
      await updateVersions.mutateAsync({ issueId, versionIds: selectedIds });
      setIsOpen(false);
      toast.success(`${type === 'fix' ? 'Fix' : 'Affects'} versions updated`);
    } catch {
      toast.error('Failed to update versions');
    }
  };
  
  const handleRemove = async (versionId: string) => {
    const newIds = (issueVersions?.map(v => v.id) || []).filter(id => id !== versionId);
    try {
      await updateVersions.mutateAsync({ issueId, versionIds: newIds });
      toast.success('Version removed');
    } catch {
      toast.error('Failed to remove version');
    }
  };
  
  const isLoading = isLoadingProject || isLoadingFix || isLoadingAffects;
  
  // For fix versions, show unreleased versions primarily
  // For affects versions, show all versions (including released)
  const availableVersions = projectVersions?.filter(v => !v.is_archived) || [];
  
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
        {!issueVersions?.length ? (
          <span className="text-sm text-muted-foreground">None</span>
        ) : (
          issueVersions?.map(version => (
            <Badge key={version.id} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {version.name}
              {version.is_released && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              <button
                type="button"
                onClick={() => handleRemove(version.id)}
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
            Add {type === 'fix' ? 'Fix Version' : 'Affects Version'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">
              Select {type === 'fix' ? 'Fix Version/s' : 'Affects Version/s'}
            </h4>
          </div>
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1">
              {availableVersions.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No versions available</p>
              ) : (
                availableVersions.map(version => (
                  <label
                    key={version.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.includes(version.id)}
                      onCheckedChange={() => handleToggle(version.id)}
                    />
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1">{version.name}</span>
                    {version.is_released && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="p-2 border-t flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateVersions.isPending}>
              {updateVersions.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
