import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as customFieldService from '../services/customFieldService';

// Field Definitions
export function useCustomFieldDefinitions() {
  return useQuery({
    queryKey: ['custom-field-definitions'],
    queryFn: customFieldService.getCustomFieldDefinitions,
  });
}

export function useCustomFieldDefinition(id: string) {
  return useQuery({
    queryKey: ['custom-field-definition', id],
    queryFn: () => customFieldService.getCustomFieldDefinition(id),
    enabled: !!id,
  });
}

export function useCreateCustomFieldDefinition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customFieldService.createCustomFieldDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success('Custom field created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create custom field: ' + error.message);
    },
  });
}

export function useUpdateCustomFieldDefinition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: Parameters<typeof customFieldService.updateCustomFieldDefinition>[1] 
    }) => customFieldService.updateCustomFieldDefinition(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['custom-field-definition', id] });
      toast.success('Custom field updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update custom field: ' + error.message);
    },
  });
}

export function useDeleteCustomFieldDefinition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customFieldService.deleteCustomFieldDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success('Custom field deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete custom field: ' + error.message);
    },
  });
}

// Field Contexts
export function useFieldContexts(projectId?: string, issueTypeId?: string) {
  return useQuery({
    queryKey: ['field-contexts', projectId, issueTypeId],
    queryFn: () => customFieldService.getFieldContexts(projectId, issueTypeId),
  });
}

export function useAddFieldContext() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customFieldService.addFieldContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-contexts'] });
      toast.success('Field added to context');
    },
    onError: (error: Error) => {
      toast.error('Failed to add field: ' + error.message);
    },
  });
}

export function useRemoveFieldContext() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customFieldService.removeFieldContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-contexts'] });
      toast.success('Field removed from context');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove field: ' + error.message);
    },
  });
}

// Field Values
export function useIssueCustomFieldValues(issueId: string) {
  return useQuery({
    queryKey: ['custom-field-values', issueId],
    queryFn: () => customFieldService.getIssueCustomFieldValues(issueId),
    enabled: !!issueId,
  });
}

export function useSetCustomFieldValue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customFieldService.setCustomFieldValue,
    onSuccess: (_, { issue_id }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-values', issue_id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update field value: ' + error.message);
    },
  });
}

export function useDeleteCustomFieldValue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ issueId, fieldId }: { issueId: string; fieldId: string }) =>
      customFieldService.deleteCustomFieldValue(issueId, fieldId),
    onSuccess: (_, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-values', issueId] });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete field value: ' + error.message);
    },
  });
}
