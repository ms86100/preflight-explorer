import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Header } from './Header';
import { ProjectSidebar } from './ProjectSidebar';
import { ClassificationBanner } from '@/components/compliance/ClassificationBanner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { clearanceLevel } = useAuth();
  const location = useLocation();

  // Check if we're in a project context
  const isProjectView = location.pathname.startsWith('/projects/') && 
    location.pathname.split('/').length > 2;

  // Mock project for demo - in real app, fetch from route params
  const mockProject = isProjectView ? {
    id: '1',
    pkey: 'PROJ',
    name: 'ProjectA',
    project_type: 'software' as const,
    template: 'scrum' as const,
    issue_counter: 0,
    is_archived: false,
    classification: 'restricted' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Classification Banner - MRTT+ Compliance */}
      <ClassificationBanner level={clearanceLevel} />
      
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Project Sidebar - Only show in project context */}
        {showSidebar && isProjectView && (
          <ProjectSidebar
            project={mockProject}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 overflow-auto',
          isProjectView && 'bg-background'
        )}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
