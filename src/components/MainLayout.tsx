
import React, { useState } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Home,
  Package,
  Key,
  Lab,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  ChevronLeft,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'API Hub', icon: <Package size={20} />, path: '/apis' },
    { label: 'Subscriptions', icon: <Key size={20} />, path: '/subscriptions' },
    { label: 'API Tester', icon: <Lab size={20} />, path: '/tester' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const sidebarVariants = {
    expanded: { width: '240px' },
    collapsed: { width: '72px' }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <motion.div
        className="h-screen bg-api-dark border-r border-border flex flex-col"
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "h-16 flex items-center px-4 border-b border-border",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <div className="text-xl font-bold text-api-primary">API Hub</div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => cn(
                      "flex items-center h-10 px-4 text-muted-foreground hover:bg-api-primary/10 hover:text-api-primary transition-colors",
                      isActive && "bg-api-primary/10 text-api-primary border-r-2 border-api-primary",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Sidebar Footer */}
        <div className={cn(
          "h-16 border-t border-border flex items-center",
          isCollapsed ? "justify-center px-2" : "px-4 justify-between"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-api-primary/20 flex items-center justify-center">
                <User size={16} className="text-api-primary" />
              </div>
              <div className="text-sm">
                <div className="font-medium">{user?.username}</div>
                <div className="text-xs text-muted-foreground">{user?.role || 'User'}</div>
              </div>
            </div>
          )}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="text-xl font-medium">
            {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu size={20} />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
