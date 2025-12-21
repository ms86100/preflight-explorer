import React from 'react';
import { useCustomFieldDefinitions, useIssueCustomFieldValues, useSetCustomFieldValue } from '../hooks/useCustomFields';
import { CustomFieldInput } from './CustomFieldInput';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';

interface CustomFieldsFormProps {
  issueId: string;
  projectId?: string;
  issueTypeId?: string;
  disabled?: boolean;
}

export function CustomFieldsForm({ issueId, disabled }: CustomFieldsFormProps) {
  const { data: fields, isLoading: fieldsLoading } = useCustomFieldDefinitions();
  const { data: values, isLoading: valuesLoading } = useIssueCustomFieldValues(issueId);
  const setFieldValue = useSetCustomFieldValue();

  const isLoading = fieldsLoading || valuesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!fields?.length) {
    return null;
  }

  const getValueForField = (fieldId: string) => {
    return values?.find(v => v.field_id === fieldId);
  };

  const handleFieldChange = (fieldId: string, newValue: {
    value_text?: string | null;
    value_number?: number | null;
    value_date?: string | null;
    value_json?: unknown | null;
  }) => {
    setFieldValue.mutate({
      issue_id: issueId,
      field_id: fieldId,
      ...newValue,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Custom Fields
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(field => (
          <CustomFieldInput
            key={field.id}
            field={field}
            value={getValueForField(field.id)}
            onChange={(newValue) => handleFieldChange(field.id, newValue)}
            disabled={disabled || setFieldValue.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
}
