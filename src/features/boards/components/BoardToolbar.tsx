import { Search, MoreHorizontal, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TeamMember } from '../types/board';

interface BoardToolbarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedAssignees: readonly string[];
  readonly onToggleAssignee: (name: string) => void;
  readonly teamMembers?: readonly TeamMember[];
  readonly isFullscreen: boolean;
  readonly onToggleFullscreen: () => void;
  readonly onOpenSettings?: () => void;
  readonly settingsMenuItems?: readonly { label: string; onClick: () => void }[];
  readonly rightContent?: React.ReactNode;
}

export function BoardToolbar({
  searchQuery,
  onSearchChange,
  selectedAssignees,
  onToggleAssignee,
  teamMembers = [],
  isFullscreen,
  onToggleFullscreen,
  onOpenSettings,
  settingsMenuItems = [],
  rightContent,
}: BoardToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-64"
          />
        </div>

        {/* Team Avatars Filter */}
        <div className="flex items-center gap-1">
          {teamMembers.map((member) => {
            const isSelected = selectedAssignees.includes(member.display_name);
            const initials = member.display_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase();

            return (
              <button
                type="button"
                key={member.id}
                onClick={() => onToggleAssignee(member.display_name)}
                aria-label={`Filter by ${member.display_name}`}
                aria-pressed={isSelected}
                className={`rounded-full transition-all ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar_url} alt={`${member.display_name} avatar`} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightContent}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenSettings}>Board settings</DropdownMenuItem>
            {settingsMenuItems.map((item, index) => (
              <DropdownMenuItem key={index} onClick={item.onClick}>
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
