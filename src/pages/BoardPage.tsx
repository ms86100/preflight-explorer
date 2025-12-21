import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ScrumBoard } from '@/features/boards';
import { useAuth } from '@/hooks/useAuth';

export default function BoardPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const { profile } = useAuth();

  return (
    <AppLayout showSidebar projectKey={projectKey}>
      <ScrumBoard 
        projectKey={projectKey || 'MRTT'} 
        projectName="MRTT Program"
      />
    </AppLayout>
  );
}
