import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Loader2, 
  Link as LinkIcon, 
  Unlink, 
  ExternalLink,
  GitBranch,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useGitOrganizations } from '../hooks/useGitOrganizations';
import { useGitRepositories, useCreateGitRepository, useUpdateGitRepository, useDeleteGitRepository } from '../hooks/useGitRepositories';
import { useProjects } from '@/features/projects';
import { toast } from 'sonner';

const formSchema = z.object({
  organization_id: z.string().min(1, 'Organization is required'),
  project_id: z.string().min(1, 'Project is required'),
  name: z.string().min(1, 'Repository name is required'),
  slug: z.string().min(1, 'Repository slug is required'),
  remote_id: z.string().min(1, 'Remote ID is required'),
  web_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  default_branch: z.string().default('main'),
  smartcommits_enabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function RepositoryLinker() {
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: organizations } = useGitOrganizations();
  const { data: repositories, isLoading } = useGitRepositories();
  const { data: projects } = useProjects();
  const createRepo = useCreateGitRepository();
  const updateRepo = useUpdateGitRepository();
  const deleteRepo = useDeleteGitRepository();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization_id: '',
      project_id: '',
      name: '',
      slug: '',
      remote_id: '',
      web_url: '',
      default_branch: 'main',
      smartcommits_enabled: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createRepo.mutateAsync({
      organization_id: values.organization_id,
      project_id: values.project_id,
      name: values.name,
      slug: values.slug,
      remote_id: values.remote_id,
      web_url: values.web_url || undefined,
      default_branch: values.default_branch,
      smartcommits_enabled: values.smartcommits_enabled,
    });
    form.reset();
    setOpen(false);
  };

  const handleToggleSmartCommits = async (repoId: string, currentValue: boolean) => {
    await updateRepo.mutateAsync({ id: repoId, smartcommits_enabled: !currentValue });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRepo.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return 'Unlinked';
    const project = projects?.find(p => p.id === projectId);
    return project ? `${project.pkey} - ${project.name}` : 'Unknown';
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return 'Unknown';
    const org = organizations?.find(o => o.id === orgId);
    return org?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Linked Repositories</h3>
          <p className="text-sm text-muted-foreground">
            Repositories linked to projects for commit and PR tracking.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!organizations?.length}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Link Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Link Repository</DialogTitle>
              <DialogDescription>
                Link a Git repository to a project to track commits and pull requests.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Git Provider</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name} ({org.provider_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.pkey} - {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repository Name</FormLabel>
                        <FormControl>
                          <Input placeholder="my-repo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug / Path</FormLabel>
                        <FormControl>
                          <Input placeholder="org/my-repo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="remote_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remote ID</FormLabel>
                      <FormControl>
                        <Input placeholder="12345 or UUID" {...field} />
                      </FormControl>
                      <FormDescription>
                        The repository ID from your Git provider.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="web_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Web URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/org/repo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="default_branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Branch</FormLabel>
                        <FormControl>
                          <Input placeholder="main" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smartcommits_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <FormLabel>Smart Commits</FormLabel>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm text-muted-foreground">
                            {field.value ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRepo.isPending}>
                    {createRepo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Link Repository
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!repositories?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No repositories linked</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {organizations?.length
                ? 'Link repositories to projects to start tracking commits and pull requests.'
                : 'Add a Git provider first, then link repositories to projects.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {repositories.map((repo) => (
            <Card key={repo.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{repo.name}</span>
                      {repo.web_url && (
                        <a
                          href={repo.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{getOrgName(repo.organization_id)}</span>
                      <span>→</span>
                      <Badge variant="secondary" className="font-normal">
                        {getProjectName(repo.project_id)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={repo.smartcommits_enabled ?? true}
                      onCheckedChange={() => handleToggleSmartCommits(repo.id, repo.smartcommits_enabled ?? true)}
                    />
                    <span className="text-sm text-muted-foreground">Smart commits</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(repo.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between this repository and the project. Commit and PR history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRepo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
