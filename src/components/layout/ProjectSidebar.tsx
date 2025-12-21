import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  Calendar,
  BarChart3,
  FileCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderKanban,
  Users,
  Layers,
  Tag,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Project } from '@/types/jira';

interface ProjectSidebarProps {
  project?: Project;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const PROJECT_NAV_ITEMS = [
  { label: 'Board', href: 'board', icon: Kanban },
  { label: 'Backlog', href: 'backlog', icon: ListTodo },
  { label: 'Active sprints', href: 'sprints', icon: Calendar },
  { label: 'Releases', href: 'releases', icon: Tag },
  { label: 'Reports', href: 'reports', icon: BarChart3 },
  { label: 'Issues', href: 'issues', icon: FileCode },
  { label: 'Components', href: 'components', icon: Layers },
];

const PROJECT_SHORTCUTS = [
  { label: 'Add shortcut', href: '#', icon: Plus },
];

export function ProjectSidebar({ 
  project, 
  isCollapsed = false, 
  onToggleCollapse 
}: ProjectSidebarProps) {
  const location = useLocation();
  const baseUrl = project ? `/projects/${project.pkey}` : '';

  const isActive = (href: string) => {
    return location.pathname.includes(`${baseUrl}/${href}`);
  };

  return (
    <aside 
      className={cn(
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-200',
        isCollapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Project Header */}
      {project && !isCollapsed && (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-sidebar-accent flex items-center justify-center">
              {project.avatar_url ? (
                <img 
                  src={project.avatar_url} 
                  alt={project.name} 
                  className="w-full h-full rounded"
                />
              ) : (
                <FolderKanban className="h-5 w-5 text-sidebar-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{project.name}</h2>
              <p className="text-xs text-sidebar-foreground/60">
                {project.template === 'scrum' ? 'Scrum' : 'Kanban'} project
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Project Header - Collapsed */}
      {project && isCollapsed && (
        <div className="p-2 flex justify-center">
          <div className="w-10 h-10 rounded bg-sidebar-accent flex items-center justify-center">
            <FolderKanban className="h-5 w-5 text-sidebar-primary" />
          </div>
        </div>
      )}

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {/* Board Section Header */}
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Planning
          </div>
        )}

        {PROJECT_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={`${baseUrl}/${item.href}`}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <Separator className="bg-sidebar-border my-4" />

        {/* Development Section */}
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Development
          </div>
        )}

        <Link
          to={`${baseUrl}/code`}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors',
            isActive('code')
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Code' : undefined}
        >
          <GitBranch className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Code</span>}
        </Link>

        <Separator className="bg-sidebar-border my-4" />

        {/* Project Shortcuts */}
        {!isCollapsed && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Project Shortcuts
            </div>
            <p className="px-3 text-xs text-sidebar-foreground/50">
              Add a link to useful information for your whole team to see.
            </p>
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add shortcut
            </button>
          </>
        )}
      </nav>

      {/* Project Settings */}
      <div className="p-2 border-t border-sidebar-border">
        <Link
          to={`${baseUrl}/settings`}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors',
            'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Project settings' : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Project settings</span>}
        </Link>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            'w-full mt-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
            isCollapsed && 'justify-center'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
