import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Star,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import { CreateProjectModal } from '@/features/projects';
import { toast } from 'sonner';

// Mock data for demo
const RECENT_PROJECTS = [
  {
    id: '1',
    pkey: 'PROJ',
    name: 'ProjectA',
    template: 'scrum',
    classification: 'restricted' as const,
    lastAccessed: '2 hours ago',
  },
  {
    id: '2',
    pkey: 'MRTT',
    name: 'MRTT Program',
    template: 'scrum',
    classification: 'export_controlled' as const,
    lastAccessed: '1 day ago',
  },
  {
    id: '3',
    pkey: 'DEV',
    name: 'Development Tools',
    template: 'kanban',
    classification: 'confidential' as const,
    lastAccessed: '3 days ago',
  },
];

const ASSIGNED_ISSUES = [
  {
    key: 'PROJ-123',
    summary: 'Implement authentication flow',
    status: 'In Progress',
    priority: 'High',
  },
  {
    key: 'PROJ-124',
    summary: 'Review security audit findings',
    status: 'To Do',
    priority: 'Highest',
  },
  {
    key: 'MRTT-45',
    summary: 'Update compliance documentation',
    status: 'In Review',
    priority: 'Medium',
  },
];

const STATS = [
  { label: 'Open Issues', value: 24, icon: AlertCircle, color: 'text-warning' },
  { label: 'In Progress', value: 8, icon: Clock, color: 'text-info' },
  { label: 'Done This Week', value: 15, icon: CheckCircle2, color: 'text-success' },
];

export default function Dashboard() {
  const { profile, isAuthenticated, clearanceLevel } = useAuth();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const handleCreateProject = async (data: any) => {
    // In real app, this would call the API
    console.log('Creating project:', data);
    toast.success(`Project "${data.name}" created successfully!`);
  };

  return (
    <>
      <CreateProjectModal
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        onSubmit={handleCreateProject}
      />
      <AppLayout showSidebar={false}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">
              {isAuthenticated ? `Welcome back, ${profile?.display_name || 'User'}` : 'Welcome to Jira'}
            </h1>
            <p className="text-muted-foreground mt-1">Your project management dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsCreateProjectOpen(true)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Create Project</h3>
                  <p className="text-sm text-muted-foreground">Start a new project</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-medium">View All Projects</h3>
                  <p className="text-sm text-muted-foreground">Browse your projects</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-info" />
                </div>
                <div>
                  <h3 className="font-medium">Search Issues</h3>
                  <p className="text-sm text-muted-foreground">Find with JQL</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {STATS.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        <span className="text-2xl font-semibold">{stat.value}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">Recent Projects</CardTitle>
                    <CardDescription>Your recently accessed projects</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/projects">View all<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {RECENT_PROJECTS.map((project) => (
                      <Link key={project.id} to={`/projects/${project.pkey}/board`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <FolderKanban className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{project.name}</h4>
                            <ClassificationBadge level={project.classification} />
                          </div>
                          <p className="text-sm text-muted-foreground">{project.pkey} • {project.template} • {project.lastAccessed}</p>
                        </div>
                        <Star className="h-4 w-4 text-muted-foreground hover:text-warning" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Assigned to Me</CardTitle>
                  <CardDescription>Issues requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ASSIGNED_ISSUES.map((issue) => (
                      <div key={issue.key} className="p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-primary">{issue.key}</span>
                          <span className={`lozenge ${issue.status === 'In Progress' ? 'lozenge-inprogress' : issue.status === 'In Review' ? 'lozenge-moved' : 'lozenge-default'}`}>{issue.status}</span>
                        </div>
                        <p className="text-sm truncate-2">{issue.summary}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${issue.priority === 'Highest' ? 'bg-destructive/10 text-destructive' : issue.priority === 'High' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>{issue.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-4">View all my issues</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">SS</div>
                      <div className="flex-1">
                        <p className="text-sm"><span className="font-medium">Sagar Sharma</span> updated <span className="text-primary">PROJ-123</span></p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">JD</div>
                      <div className="flex-1">
                        <p className="text-sm"><span className="font-medium">John Doe</span> commented on <span className="text-primary">MRTT-45</span></p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
