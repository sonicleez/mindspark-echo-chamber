
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
import { User, Settings, LogOut, Shield, UserCircle } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import AdminBadge from './AdminBadge';

// Reuse the same admin status cache as other components
// This would normally be in a shared file, but for simplicity we're duplicating the declaration
const adminStatusCache = new Map<string, {isAdmin: boolean, timestamp: number}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

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
        
        // Check cache first
        const now = Date.now();
        const cachedStatus = adminStatusCache.get(user.id);
        
        if (cachedStatus && (now - cachedStatus.timestamp < CACHE_EXPIRY)) {
          console.log('UserMenu: Using cached admin status');
          if (isMounted) {
            setIsAdmin(cachedStatus.isAdmin);
            setIsCheckingRole(false);
          }
          return;
        }
        
        // Call the security definer function directly through RPC
        const { data, error } = await supabase.rpc('check_if_user_is_admin', {
          user_id: user.id
        });
        
        console.log('UserMenu: Admin role check result:', { data, error });
        
        if (error) {
          console.error('UserMenu: Error checking admin role:', error);
          if (isMounted) {
            setIsAdmin(false);
            setIsCheckingRole(false);
          }
          return;
        }
        
        const isUserAdmin = Boolean(data);
        
        // Update cache
        adminStatusCache.set(user.id, {
          isAdmin: isUserAdmin,
          timestamp: now
        });
        
        if (isMounted) {
          setIsAdmin(isUserAdmin);
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
    
    // Add a small delay to ensure user object is fully loaded
    const timer = setTimeout(() => {
      if (user?.id) {
        checkAdminRole();
      } else {
        setIsCheckingRole(false);
      }
    }, 300);
    
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
                <div className="flex items-center">
                  <AdminBadge />
                  <Shield className="mr-1 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </div>
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
