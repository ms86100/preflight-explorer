import { supabase } from "@/integrations/supabase/client";

export interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  is_default: boolean;
  is_active: boolean;
  is_draft: boolean;
  draft_of: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepRow {
  id: string;
  workflow_id: string;
  status_id: string;
  position_x: number;
  position_y: number;
  is_initial: boolean;
  created_at: string;
  status?: {
    id: string;
    name: string;
    category: string;
    color: string;
  };
}

// Condition types for transitions
export interface TransitionCondition {
  type: 'only_assignee' | 'only_reporter' | 'user_in_group' | 'user_in_role' | 'permission_check';
  group?: string;
  role?: string;
  permission?: string;
}

// Validator types for transitions
export interface TransitionValidator {
  type: 'field_required' | 'field_not_empty' | 'subtasks_closed' | 'resolution_set' | 'custom_field_value';
  field?: string;
  value?: string;
  message?: string;
}

// Post-function types for transitions
export interface TransitionPostFunction {
  type: 'set_field' | 'clear_field' | 'assign_to_lead' | 'assign_to_reporter' | 'add_comment' | 'send_notification';
  field?: string;
  value?: string;
  comment?: string;
}

export interface WorkflowTransitionRow {
  id: string;
  workflow_id: string;
  from_step_id: string;
  to_step_id: string;
  name: string;
  description: string | null;
  conditions: TransitionCondition[];
  validators: TransitionValidator[];
  post_functions: TransitionPostFunction[];
  screen_id: string | null;
  created_at: string;
}

export interface WorkflowWithDetails extends WorkflowRow {
  steps: WorkflowStepRow[];
  transitions: WorkflowTransitionRow[];
}

// Helper to cast DB transition row to typed interface
function castTransition(t: any): WorkflowTransitionRow {
  return {
    ...t,
    conditions: (Array.isArray(t.conditions) ? t.conditions : []) as TransitionCondition[],
    validators: (Array.isArray(t.validators) ? t.validators : []) as TransitionValidator[],
    post_functions: (Array.isArray(t.post_functions) ? t.post_functions : []) as TransitionPostFunction[],
  };
}
export async function getWorkflows(projectId?: string, includeDrafts = false): Promise<WorkflowRow[]> {
  let query = supabase
    .from('workflows')
    .select('*')
    .eq('is_active', true);
  
  // By default, exclude drafts from the main list
  if (!includeDrafts) {
    query = query.eq('is_draft', false);
  }
  
  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
}

export async function getWorkflow(id: string): Promise<WorkflowRow | null> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getWorkflowWithDetails(id: string): Promise<WorkflowWithDetails | null> {
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();
  
  if (workflowError) throw workflowError;
  if (!workflow) return null;

  const { data: steps, error: stepsError } = await supabase
    .from('workflow_steps')
    .select(`
      *,
      status:issue_statuses(id, name, category, color)
    `)
    .eq('workflow_id', id);
  
  if (stepsError) throw stepsError;

  const { data: transitions, error: transitionsError } = await supabase
    .from('workflow_transitions')
    .select('*')
    .eq('workflow_id', id);
  
  if (transitionsError) throw transitionsError;

  return {
    ...workflow,
    steps: (steps || []).map(s => ({
      ...s,
      status: s.status as WorkflowStepRow['status']
    })),
    transitions: (transitions || []).map(t => castTransition(t))
  };
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  project_id?: string;
}): Promise<WorkflowRow> {
  const { data: workflow, error } = await supabase
    .from('workflows')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return workflow;
}

export async function updateWorkflow(id: string, data: Partial<WorkflowRow>): Promise<WorkflowRow> {
  const { data: workflow, error } = await supabase
    .from('workflows')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return workflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * Clone a workflow including all its steps and transitions
 */
export async function cloneWorkflow(
  sourceWorkflowId: string,
  newName: string,
  projectId?: string
): Promise<WorkflowRow> {
  // 1. Get the source workflow with details
  const sourceWorkflow = await getWorkflowWithDetails(sourceWorkflowId);
  if (!sourceWorkflow) {
    throw new Error('Source workflow not found');
  }

  // 2. Create the new workflow
  const newWorkflow = await createWorkflow({
    name: newName,
    description: sourceWorkflow.description || undefined,
    project_id: projectId,
  });

  // 3. Create a mapping of old step IDs to new step IDs
  const stepIdMapping = new Map<string, string>();

  // 4. Clone all steps
  for (const step of sourceWorkflow.steps) {
    const { data: newStep, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_id: newWorkflow.id,
        status_id: step.status_id,
        position_x: step.position_x,
        position_y: step.position_y,
        is_initial: step.is_initial,
      })
      .select()
      .single();
    
    if (error) throw error;
    stepIdMapping.set(step.id, newStep.id);
  }

  // 5. Clone all transitions using the new step IDs
  for (const transition of sourceWorkflow.transitions) {
    const newFromStepId = stepIdMapping.get(transition.from_step_id);
    const newToStepId = stepIdMapping.get(transition.to_step_id);
    
    if (newFromStepId && newToStepId) {
      const { error } = await supabase
        .from('workflow_transitions')
        .insert({
          workflow_id: newWorkflow.id,
          from_step_id: newFromStepId,
          to_step_id: newToStepId,
          name: transition.name,
          description: transition.description,
        });
      
      if (error) throw error;
    }
  }

  return newWorkflow;
}

// Workflow Steps
export async function addWorkflowStep(data: {
  workflow_id: string;
  status_id: string;
  position_x?: number;
  position_y?: number;
  is_initial?: boolean;
}): Promise<WorkflowStepRow> {
  const { data: step, error } = await supabase
    .from('workflow_steps')
    .insert(data)
    .select(`
      *,
      status:issue_statuses(id, name, category, color)
    `)
    .single();
  if (error) throw error;
  return {
    ...step,
    status: step.status as WorkflowStepRow['status']
  };
}

export async function updateWorkflowStep(id: string, data: {
  position_x?: number;
  position_y?: number;
  is_initial?: boolean;
}): Promise<WorkflowStepRow> {
  const { data: step, error } = await supabase
    .from('workflow_steps')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      status:issue_statuses(id, name, category, color)
    `)
    .single();
  if (error) throw error;
  return {
    ...step,
    status: step.status as WorkflowStepRow['status']
  };
}

export async function deleteWorkflowStep(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_steps')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Workflow Transitions
export async function addWorkflowTransition(data: {
  workflow_id: string;
  from_step_id: string;
  to_step_id: string;
  name: string;
  description?: string;
  conditions?: TransitionCondition[];
  validators?: TransitionValidator[];
  post_functions?: TransitionPostFunction[];
}): Promise<WorkflowTransitionRow> {
  const { data: transition, error } = await supabase
    .from('workflow_transitions')
    .insert(data as any)
    .select()
    .single();
  if (error) throw error;
  return castTransition(transition);
}

export async function updateWorkflowTransition(id: string, data: {
  name?: string;
  description?: string;
  conditions?: TransitionCondition[];
  validators?: TransitionValidator[];
  post_functions?: TransitionPostFunction[];
}): Promise<WorkflowTransitionRow> {
  const { data: transition, error } = await supabase
    .from('workflow_transitions')
    .update(data as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return castTransition(transition);
}

export async function deleteWorkflowTransition(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_transitions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============= Draft Workflow Functions =============

/**
 * Get the draft for a workflow if it exists
 */
export async function getWorkflowDraft(workflowId: string): Promise<WorkflowRow | null> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('draft_of', workflowId)
    .eq('is_draft', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

/**
 * Create a draft copy of an existing workflow
 */
export async function createWorkflowDraft(sourceWorkflowId: string): Promise<WorkflowRow> {
  // Check if a draft already exists
  const existingDraft = await getWorkflowDraft(sourceWorkflowId);
  if (existingDraft) {
    throw new Error('A draft already exists for this workflow');
  }
  
  // Get the source workflow with details
  const sourceWorkflow = await getWorkflowWithDetails(sourceWorkflowId);
  if (!sourceWorkflow) {
    throw new Error('Source workflow not found');
  }
  
  // Create the draft workflow
  const { data: draftWorkflow, error: workflowError } = await supabase
    .from('workflows')
    .insert({
      name: `${sourceWorkflow.name} (Draft)`,
      description: sourceWorkflow.description,
      project_id: sourceWorkflow.project_id,
      is_draft: true,
      draft_of: sourceWorkflowId,
      is_active: true,
    })
    .select()
    .single();
  
  if (workflowError) throw workflowError;
  
  // Create a mapping of old step IDs to new step IDs
  const stepIdMapping = new Map<string, string>();
  
  // Clone all steps
  for (const step of sourceWorkflow.steps) {
    const { data: newStep, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_id: draftWorkflow.id,
        status_id: step.status_id,
        position_x: step.position_x,
        position_y: step.position_y,
        is_initial: step.is_initial,
      })
      .select()
      .single();
    
    if (error) throw error;
    stepIdMapping.set(step.id, newStep.id);
  }
  
  // Clone all transitions
  for (const transition of sourceWorkflow.transitions) {
    const newFromStepId = stepIdMapping.get(transition.from_step_id);
    const newToStepId = stepIdMapping.get(transition.to_step_id);
    
    if (newFromStepId && newToStepId) {
      const { error } = await supabase
        .from('workflow_transitions')
        .insert({
          workflow_id: draftWorkflow.id,
          from_step_id: newFromStepId,
          to_step_id: newToStepId,
          name: transition.name,
          description: transition.description,
          conditions: transition.conditions,
          validators: transition.validators,
          post_functions: transition.post_functions,
        } as any);
      
      if (error) throw error;
    }
  }
  
  return draftWorkflow;
}

/**
 * Publish a draft workflow, replacing the original
 */
export async function publishWorkflowDraft(draftId: string): Promise<WorkflowRow> {
  // Get the draft workflow
  const { data: draftWorkflow, error: draftError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', draftId)
    .eq('is_draft', true)
    .single();
  
  if (draftError || !draftWorkflow) {
    throw new Error('Draft workflow not found');
  }
  
  if (!draftWorkflow.draft_of) {
    throw new Error('This draft has no parent workflow');
  }
  
  const parentId = draftWorkflow.draft_of;
  
  // Get the draft with all details
  const draftDetails = await getWorkflowWithDetails(draftId);
  if (!draftDetails) {
    throw new Error('Could not load draft details');
  }
  
  // Delete all steps and transitions from the parent (cascade will handle transitions)
  const { error: deleteStepsError } = await supabase
    .from('workflow_steps')
    .delete()
    .eq('workflow_id', parentId);
  
  if (deleteStepsError) throw deleteStepsError;
  
  // Create a mapping for new step IDs
  const stepIdMapping = new Map<string, string>();
  
  // Copy steps from draft to parent
  for (const step of draftDetails.steps) {
    const { data: newStep, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_id: parentId,
        status_id: step.status_id,
        position_x: step.position_x,
        position_y: step.position_y,
        is_initial: step.is_initial,
      })
      .select()
      .single();
    
    if (error) throw error;
    stepIdMapping.set(step.id, newStep.id);
  }
  
  // Copy transitions from draft to parent
  for (const transition of draftDetails.transitions) {
    const newFromStepId = stepIdMapping.get(transition.from_step_id);
    const newToStepId = stepIdMapping.get(transition.to_step_id);
    
    if (newFromStepId && newToStepId) {
      const { error } = await supabase
        .from('workflow_transitions')
        .insert({
          workflow_id: parentId,
          from_step_id: newFromStepId,
          to_step_id: newToStepId,
          name: transition.name,
          description: transition.description,
          conditions: transition.conditions,
          validators: transition.validators,
          post_functions: transition.post_functions,
        } as any);
      
      if (error) throw error;
    }
  }
  
  // Update the parent workflow with draft's metadata and set published_at
  const { data: updatedParent, error: updateError } = await supabase
    .from('workflows')
    .update({
      name: draftWorkflow.name.replace(' (Draft)', ''),
      description: draftWorkflow.description,
      published_at: new Date().toISOString(),
    })
    .eq('id', parentId)
    .select()
    .single();
  
  if (updateError) throw updateError;
  
  // Delete the draft
  await supabase
    .from('workflows')
    .delete()
    .eq('id', draftId);
  
  return updatedParent;
}

/**
 * Discard a draft workflow
 */
export async function discardWorkflowDraft(draftId: string): Promise<void> {
  const { data: draft, error: draftError } = await supabase
    .from('workflows')
    .select('is_draft')
    .eq('id', draftId)
    .single();
  
  if (draftError || !draft) {
    throw new Error('Draft not found');
  }
  
  if (!draft.is_draft) {
    throw new Error('Cannot discard a non-draft workflow');
  }
  
  // Delete the draft (cascade will handle steps and transitions)
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', draftId);
  
  if (error) throw error;
}
