import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { useProject } from '@/features/projects';
import { useProjectComponents, Component } from '@/features/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Layers, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Loader2,
  FolderKanban,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface TeamMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

type DefaultAssigneeType = 'component_lead' | 'project_lead' | 'project_default' | 'unassigned';

const DEFAULT_ASSIGNEE_LABELS: Record<DefaultAssigneeType, string> = {
  component_lead: 'Component Lead',
  project_lead: 'Project Lead',
  project_default: 'Project Default',
  unassigned: 'Unassigned',
};

export default function ComponentsPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const { data: project } = useProject(projectKey || '');
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [newComponent, setNewComponent] = useState({
    name: '',
    description: '',
    lead_id: '',
    default_assignee_type: 'unassigned' as DefaultAssigneeType,
  });

  const { data: components, isLoading } = useProjectComponents(project?.id);

  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_directory')
        .select('id, display_name, avatar_url')
        .eq('is_active', true);
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const createComponent = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error('No project');
      const { error } = await supabase.from('components').insert({
        project_id: project.id,
        name: newComponent.name,
        description: newComponent.description || null,
        lead_id: newComponent.lead_id || null,
        default_assignee_type: newComponent.default_assignee_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      setIsCreateOpen(false);
      setNewComponent({ name: '', description: '', lead_id: '', default_assignee_type: 'unassigned' });
      toast.success('Component created');
    },
    onError: () => toast.error('Failed to create component'),
  });

  const updateComponent = useMutation({
    mutationFn: async () => {
      if (!selectedComponent) throw new Error('No component selected');
      const { error } = await supabase
        .from('components')
        .update({
          name: newComponent.name,
          description: newComponent.description || null,
          lead_id: newComponent.lead_id || null,
          default_assignee_type: newComponent.default_assignee_type,
        })
        .eq('id', selectedComponent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      setIsEditOpen(false);
      setSelectedComponent(null);
      toast.success('Component updated');
    },
    onError: () => toast.error('Failed to update component'),
  });

  const archiveComponent = useMutation({
    mutationFn: async ({ componentId, archive }: { componentId: string; archive: boolean }) => {
      const { error } = await supabase
        .from('components')
        .update({ is_archived: archive })
        .eq('id', componentId);
      if (error) throw error;
    },
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      toast.success(archive ? 'Component archived' : 'Component restored');
    },
    onError: () => toast.error('Failed to update component'),
  });

  const deleteComponent = useMutation({
    mutationFn: async (componentId: string) => {
      const { error } = await supabase.from('components').delete().eq('id', componentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      setDeleteDialogOpen(false);
      setComponentToDelete(null);
      toast.success('Component deleted');
    },
    onError: () => toast.error('Failed to delete component'),
  });

  const handleEdit = (component: Component) => {
    setSelectedComponent(component);
    setNewComponent({
      name: component.name,
      description: component.description || '',
      lead_id: component.lead_id || '',
      default_assignee_type: (component.default_assignee_type as DefaultAssigneeType) || 'unassigned',
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (component: Component) => {
    setComponentToDelete(component);
    setDeleteDialogOpen(true);
  };

  const activeComponents = components?.filter(c => !c.is_archived) || [];
  const archivedComponents = components?.filter(c => c.is_archived) || [];

  if (isLoading) {
    return (
      <AppLayout showSidebar projectKey={projectKey}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar projectKey={projectKey}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6" />
              Components
            </h1>
            <p className="text-muted-foreground">
              Organize issues into logical groupings for {project?.name}
            </p>
          </div>
          <Button onClick={() => {
            setNewComponent({ name: '', description: '', lead_id: '', default_assignee_type: 'unassigned' });
            setIsCreateOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Component
          </Button>
        </div>

        {activeComponents.length === 0 && archivedComponents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No components yet</h3>
              <p className="text-muted-foreground mb-4">
                Components help you organize issues by area, team, or feature.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first component
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Default Assignee</TableHead>
                    <TableHead className="text-right">Issues</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeComponents.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-primary" />
                          {component.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {component.description || '-'}
                      </TableCell>
                      <TableCell>
                        {component.lead ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={component.lead.avatar_url || ''} alt={`${component.lead.display_name || 'Component lead'} avatar`} />
                              <AvatarFallback className="text-xs">
                                {component.lead.display_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{component.lead.display_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {DEFAULT_ASSIGNEE_LABELS[(component.default_assignee_type as DefaultAssigneeType) || 'unassigned']}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{component.issue_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(component)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveComponent.mutate({ componentId: component.id, archive: true })}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(component)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Archived Components */}
            {archivedComponents.length > 0 && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {showArchived ? 'Hide' : 'Show'} archived components ({archivedComponents.length})
                </Button>
                
                {showArchived && (
                  <Card className="opacity-60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Lead</TableHead>
                          <TableHead className="text-right">Issues</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedComponents.map((component) => (
                          <TableRow key={component.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                {component.name}
                                <Badge variant="secondary" className="text-xs">Archived</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {component.description || '-'}
                            </TableCell>
                            <TableCell>
                              {component.lead ? (
                                <span className="text-sm">{component.lead.display_name}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{component.issue_count || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => archiveComponent.mutate({ componentId: component.id, archive: false })}>
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Restore
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteClick(component)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Component Dialog */}
      <Dialog 
        open={isCreateOpen || isEditOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setSelectedComponent(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? 'Edit Component' : 'Create Component'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="component-name">Name</Label>
              <Input
                id="component-name"
                placeholder="e.g., Backend API"
                value={newComponent.name}
                onChange={(e) => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-description">Description</Label>
              <Textarea
                id="component-description"
                placeholder="What does this component cover?"
                value={newComponent.description}
                onChange={(e) => setNewComponent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-lead">Component Lead</Label>
              <Select 
                value={newComponent.lead_id} 
                onValueChange={(value) => setNewComponent(prev => ({ ...prev, lead_id: value }))}
              >
                <SelectTrigger id="component-lead">
                  <SelectValue placeholder="Select a lead (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || ''} alt={`${member.display_name || 'Team member'} avatar`} />
                          <AvatarFallback className="text-xs">
                            {member.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {member.display_name || 'Unknown'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-assignee">Default Assignee</Label>
              <Select 
                value={newComponent.default_assignee_type} 
                onValueChange={(value) => setNewComponent(prev => ({ ...prev, default_assignee_type: value as DefaultAssigneeType }))}
              >
                <SelectTrigger id="default-assignee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="component_lead">Component Lead</SelectItem>
                  <SelectItem value="project_lead">Project Lead</SelectItem>
                  <SelectItem value="project_default">Project Default</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When an issue is assigned to this component, it will automatically be assigned to this person.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => isEditOpen ? updateComponent.mutate() : createComponent.mutate()} 
              disabled={!newComponent.name}
            >
              {isEditOpen ? 'Save Changes' : 'Create Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{componentToDelete?.name}"?
              {(componentToDelete?.issue_count || 0) > 0 && (
                <span className="block mt-2 text-amber-600">
                  This component has {componentToDelete?.issue_count} linked issue(s). 
                  The issues will not be deleted, but they will no longer be associated with this component.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => componentToDelete && deleteComponent.mutate(componentToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
