import { useState, useCallback, useEffect, useMemo } from 'react';
import { useBoardTransitionValidation } from './useBoardTransitionValidation';
import type { BoardIssue, BoardColumn } from '../types/board';

interface UseBoardStateOptions {
  initialIssues: readonly BoardIssue[];
  columns: readonly BoardColumn[];
  onIssueMove?: (issueId: string, newStatus: string) => void;
}

export function useBoardState({ initialIssues, columns, onIssueMove }: UseBoardStateOptions) {
  const [issues, setIssues] = useState(initialIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { createDropValidator } = useBoardTransitionValidation();

  // Sync local state with prop changes (for real-time updates)
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  // Build issue status map for validation
  const issueStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach(issue => {
      map.set(issue.id, issue.status);
    });
    return map;
  }, [issues]);

  // Create the drop validator
  const validateDrop = useMemo(
    () => createDropValidator(issueStatusMap),
    [createDropValidator, issueStatusMap]
  );

  // Helper to check if issue belongs to a column
  const issueInColumn = useCallback((issue: BoardIssue, column: BoardColumn): boolean => {
    const statusIds = column.statusIds || [];
    if (statusIds.length === 0) return issue.status === column.id;
    return statusIds.includes(issue.status);
  }, []);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        !searchQuery ||
        issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.issue_key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAssignee =
        selectedAssignees.length === 0 ||
        (issue.assignee && selectedAssignees.includes(issue.assignee.display_name));

      return matchesSearch && matchesAssignee;
    });
  }, [issues, searchQuery, selectedAssignees]);

  // Get issues by column
  const getColumnIssues = useCallback(
    (column: BoardColumn) => {
      return filteredIssues.filter((issue) => issueInColumn(issue, column));
    },
    [filteredIssues, issueInColumn]
  );

  // Handle drag and drop
  const handleIssueDrop = useCallback((issueId: string, targetStatusId: string) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === issueId ? { ...issue, status: targetStatusId } : issue))
    );
    onIssueMove?.(issueId, targetStatusId);
  }, [onIssueMove]);

  // Toggle assignee filter
  const toggleAssignee = useCallback((name: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  // Build status info for columns with multiple statuses
  const getColumnStatuses = useCallback((column: BoardColumn): { id: string; name: string; category?: string }[] => {
    if (column.statuses && column.statuses.length > 0) {
      return [...column.statuses];
    }
    if (column.statusIds && column.statusIds.length > 1) {
      return column.statusIds.map(id => ({ id, name: id }));
    }
    return [];
  }, []);

  return {
    issues,
    searchQuery,
    setSearchQuery,
    selectedAssignees,
    isFullscreen,
    setIsFullscreen,
    issueStatusMap,
    validateDrop,
    issueInColumn,
    filteredIssues,
    getColumnIssues,
    handleIssueDrop,
    toggleAssignee,
    getColumnStatuses,
  };
}
