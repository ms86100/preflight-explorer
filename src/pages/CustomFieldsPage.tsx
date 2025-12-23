
import { AppLayout } from '@/components/layout/AppLayout';
import { CustomFieldsManager } from '@/features/custom-fields';

export default function CustomFieldsPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Custom Fields</h1>
          <p className="text-muted-foreground">
            Configure custom fields to extend issue data with project-specific information
          </p>
        </div>

        <CustomFieldsManager />
      </div>
    </AppLayout>
  );
}
