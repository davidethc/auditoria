'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { DataTable, type ColumnDef } from '@/components/ui/table';
import { RoleSelect } from '@/components/RoleSelect';
import { Loader } from '@/components/ui/loader';
import { toast } from '@/components/ui/toast';
import { ShieldAlert, Users as UsersIcon } from 'lucide-react';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
}

export default function AdminUsersPage() {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Verificar rol del usuario actual
  useEffect(() => {
    const checkUserRole = async () => {
      // 1️⃣ Primero verificar la sesión
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setIsCheckingRole(false);
        return;
      }

      // 2️⃣ Luego consultar el rol
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error verificando rol:', error);
        router.replace('/');
        setIsCheckingRole(false);
        return;
      }

      if (!data) {
        // Usuario sin perfil - no tiene acceso
        router.replace('/');
        setIsCheckingRole(false);
        return;
      }

      const role = data.role as UserRole;

      if (role !== 'auditor_interno') {
        router.replace('/');
        setIsCheckingRole(false);
        return;
      }

      setUserRole(role);
      setIsCheckingRole(false);
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [authLoading, router]);

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      if (userRole !== 'auditor_interno') return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .order('email', { ascending: true });

        if (error) {
          console.error('Error cargando usuarios:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          setUsers([]);
          toast.error('Error al cargar usuarios', {
            description: error.message || 'No se pudieron cargar los usuarios',
          });
        } else {
          const usersData = data || [];
          setUsers(usersData);
          // Solo mostrar toast si hay usuarios cargados
          if (usersData.length > 0) {
            toast.success('Usuarios cargados', {
              description: `Se cargaron ${usersData.length} usuario${usersData.length !== 1 ? 's' : ''} correctamente`,
            });
          }
        }
      } catch (error) {
        console.error('Error inesperado cargando usuarios:', error);
        setUsers([]);
        toast.error('Error inesperado', {
          description: 'Ocurrió un error al cargar los usuarios',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!isCheckingRole && userRole === 'auditor_interno') {
      loadUsers();
    }
  }, [userRole, isCheckingRole]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'full_name',
      header: 'Nombre',
      cell: ({ row }) => {
        const name = row.original.full_name;
        return (
          <div className="font-medium">
            {name || <span className="text-muted-foreground italic">Sin nombre</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        return <div className="text-sm">{row.original.email}</div>;
      },
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <RoleSelect
            userId={user.id}
            currentRole={user.role}
            onRoleChange={(newRole) => handleRoleChange(user.id, newRole)}
            className="w-48"
          />
        );
      },
    },
  ];

  // Mostrar loading mientras se verifica autenticación o rol
  if (authLoading || isCheckingRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader variant="cube" size={48}>
          <span className="text-sm text-muted-foreground mt-4">Verificando permisos...</span>
        </Loader>
      </div>
    );
  }

  // Si no es admin, no mostrar nada (ya se redirigió)
  if (userRole !== 'auditor_interno') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <UsersIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administración de Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los roles de los usuarios del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de permisos */}
      <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/50">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          Solo usuarios con rol <span className="font-semibold text-foreground">Auditor Interno</span> pueden
          acceder a esta página.
        </p>
      </div>

      {/* Tabla de usuarios */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader variant="cube" size={48}>
            <span className="text-sm text-muted-foreground mt-4">Cargando usuarios...</span>
          </Loader>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <DataTable
            columns={columns}
            data={users}
            searchable={true}
            searchPlaceholder="Buscar por nombre o email..."
            pagination={true}
            pageSize={10}
            emptyMessage="No se encontraron usuarios."
            enableAnimations={true}
          />
        </div>
      )}
    </div>
  );
}

