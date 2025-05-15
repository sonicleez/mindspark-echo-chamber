
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Lock, UserCircle } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminRole = async () => {
      if (!user?.id) {
        if (isMounted) {
          setIsCheckingRole(false);
        }
        return;
      }
      
      try {
        console.log('UserMenu: Checking admin role for user:', user.id);
        
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        
        console.log('UserMenu: Admin role check result:', { data, error });
        
        if (error) {
          console.error('UserMenu: Error checking admin role:', error);
          if (isMounted) {
            setIsAdmin(false);
            setIsCheckingRole(false);
          }
          return;
        }
        
        if (isMounted) {
          setIsAdmin(data && data.length > 0);
          setIsCheckingRole(false);
        }
      } catch (error) {
        console.error('UserMenu: Error checking admin role:', error);
        if (isMounted) {
          setIsAdmin(false);
          setIsCheckingRole(false);
        }
      }
    };
    
    // Add a longer delay to ensure user is properly loaded
    const timer = setTimeout(() => {
      if (user?.id) {
        checkAdminRole();
      } else {
        setIsCheckingRole(false);
      }
    }, 800);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user?.id]);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
          <User className="h-4 w-4" />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        {isCheckingRole ? (
          <DropdownMenuItem disabled>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent"></div>
            <span>Checking permissions...</span>
          </DropdownMenuItem>
        ) : isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin">
                <Lock className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
