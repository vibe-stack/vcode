import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import type { User as UserType } from '@/stores/auth';

interface UserMenuProps {
  user: UserType;
  onOpenSettings: () => void;
}

function UserMenu({ user, onOpenSettings }: UserMenuProps) {
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = (user: UserType) => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (user: UserType) => {
    return user.name || user.username || user.email;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-auto px-2 rounded-md hover:bg-slate-700 transition-colors"
        >
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={user.image} alt={getDisplayName(user)} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm max-w-[100px] truncate">
            {getDisplayName(user)}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image} alt={getDisplayName(user)} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-sm">{getDisplayName(user)}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onOpenSettings}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserAvatarButtonProps {
  onOpenSettings: () => void;
}

export function UserAvatarButton({ onOpenSettings }: UserAvatarButtonProps) {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  return <UserMenu user={user} onOpenSettings={onOpenSettings} />;
}
