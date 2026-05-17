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
  Shield,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { supabase } from '@/utils/supabase';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiresRole?: UserRole;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Plan de Trabajo',
    href: '/plan-trabajo',
    icon: ClipboardList,
  },
  {
    title: 'Mis Auditorías',
    icon: FileText,
    children: [
      {
        title: 'Auditorías',
        href: '/auditorias?view=auditorias',
        icon: FileText,
      },
      {
        title: 'Proceso',
        icon: ClipboardList,
        children: [
          {
            title: 'Planificada',
            href: '/auditorias?view=proceso&stage=PLANIFICADA',
            icon: FileCheck,
          },
          {
            title: 'En Preparación',
            href: '/auditorias?view=proceso&stage=EN_PREPARACION',
            icon: FileCheck,
          },
          {
            title: 'En Ejecución',
            href: '/auditorias?view=proceso&stage=EN_EJECUCION',
            icon: FileCheck,
          },
          {
            title: 'En Reporte',
            href: '/auditorias?view=proceso&stage=EN_REPORTE',
            icon: FileCheck,
          },
          {
            title: 'Cerrada',
            href: '/auditorias?view=proceso&stage=CERRADA',
            icon: FileCheck,
          },
        ],
      },
    ],
  },
  {
    title: 'Historial de Hallazgos',
    href: '/auditorias/historial-hallazgos',
    icon: FileCheck,
    requiresRole: 'auditado',
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Guía de Flujos',
    href: '/guia-flujos',
    icon: ClipboardList,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Revisión de Informes',
    href: '/auditorias/revision',
    icon: FileCheck,
    requiresRole: 'auditor_interno',
  },
  {
    title: 'Revisión de Descargos',
    href: '/auditorias/revision-descargos',
    icon: FileCheck,
    requiresRole: 'auditor_interno',
  },
  {
    title: 'Administración',
    href: '/admin/users',
    icon: Shield,
    requiresRole: 'auditor_interno',
  },
];

const roleDisplayName: Record<UserRole, string> = {
  auditor_interno: 'Auditor Interno',
  auditor: 'Auditor',
  auditado: 'Auditado',
};

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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

  // Función para renderizar items de navegación recursivamente
  const renderNavItem = (item: NavItem, level: number = 0) => {
    const Icon = item.icon;
    const isActive = item.href && pathname === item.href.split('?')[0]; // Check base path
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.title);

    const handleClick = () => {
      if (hasChildren) {
        setExpanded(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.title)) {
            newSet.delete(item.title);
          } else {
            newSet.add(item.title);
          }
          return newSet;
        });
      }
    };

    return (
      <div key={item.title}>
        {item.href ? (
          <Link href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-primary/10 text-primary hover:bg-primary/15 font-medium",
                level > 0 && "ml-6"
              )}
              onClick={hasChildren ? handleClick : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.title}</span>
              {hasChildren && (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />
              )}
              {item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              level > 0 && "ml-6"
            )}
            onClick={handleClick}
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1 text-left">{item.title}</span>
            {hasChildren && (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        )}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
            <h2 className="text-xl font-bold text-destructive">
              {userRole ? roleDisplayName[userRole] : 'Usuario'}
            </h2>
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
              filteredNavItems.map((item) => renderNavItem(item))
            )}
          </nav>

          <div className="px-4 py-4 border-t">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/60 border border-border/60">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm shadow-sm">
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

