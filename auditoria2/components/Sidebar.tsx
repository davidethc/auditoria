'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  BarChart3,
  Calendar,
  Folder,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { supabase } from '@/utils/supabase';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiresRole?: UserRole;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: Folder,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Administración',
    href: '/admin/users',
    icon: Shield,
    requiresRole: 'auditor_interno',
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Check if we're on a public route
  const publicRoutes = ['/login', '/signup', '/verify-email', '/reset-password', '/update-password'];
  const isPublicRoute = publicRoutes.includes(pathname || '');

  // Obtener rol del usuario
  useEffect(() => {
    const loadRole = async () => {
      // 1️⃣ Primero verificar la sesión
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setIsLoadingRole(false);
        return;
      }

      // 2️⃣ Luego consultar el rol
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        // Errores esperados (no son realmente errores)
        const isExpectedError = error.code === 'PGRST116' || error.code === 'PGRST301';
        
        // Error de recursión infinita en RLS - problema de configuración en Supabase
        const isRLSRecursionError = error.code === '42P17';
        
        if (isRLSRecursionError) {
          // Este es un error de configuración en Supabase que necesita ser arreglado
          console.warn(
            '⚠️ Error de RLS en Supabase: Las políticas de la tabla "users" tienen recursión infinita.\n' +
            'Por favor, revisa las políticas RLS en Supabase. No se puede obtener el rol del usuario.'
          );
        } else if (!isExpectedError) {
          // Otro tipo de error real
          console.error('Error obteniendo rol:', {
            message: error.message || 'Error desconocido',
            code: error.code || 'sin código',
            details: error.details || null,
            hint: error.hint || null
          });
        }
        // En cualquier caso, establecer rol como null
        setUserRole(null);
        setIsLoadingRole(false);
        return;
      }

      if (!data) {
        // Usuario sin perfil todavía - esto es normal, no es un error
        setUserRole(null);
        setIsLoadingRole(false);
        return;
      }

      setUserRole(data.role as UserRole);
      setIsLoadingRole(false);
    };

    loadRole();
  }, [user]);

  // Filtrar items de navegación según el rol
  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiresRole) return true;
    return userRole === item.requiresRole;
  });

  // Don't show sidebar if no user or on public route
  if (!user || isPublicRoute) return null;

  return (
    <>
      <aside 
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 bg-card border-r border-border transition-all duration-300",
          isCollapsed ? "lg:w-0" : "lg:w-64"
        )}
        style={{ overflow: isCollapsed ? 'hidden' : 'visible' }}
      >
        <div className={cn(
          "flex flex-col h-full transition-all duration-300 w-64",
          isCollapsed && "opacity-0 pointer-events-none"
        )}>
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Auditoría</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8"
              title="Ocultar sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {isLoadingRole ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Cargando...</div>
              </div>
            ) : (
              filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-secondary font-medium"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })
            )}
          </nav>

          <div className="px-4 py-4 border-t">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userRole ? userRole.replace('_', ' ') : 'Usuario'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* Toggle button when collapsed */}
      {isCollapsed && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCollapse}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-r-full rounded-l-none border-l-0 shadow-lg bg-card hover:bg-accent"
          title="Mostrar sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}

