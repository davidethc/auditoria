'use client';

import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div 
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-all duration-300",
          isCollapsed ? "lg:pl-0" : "lg:pl-64"
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/40 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          <SidebarProvider>
            <ToastProvider>
              <ProtectedRoute>
                <LayoutContent>{children}</LayoutContent>
              </ProtectedRoute>
            </ToastProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
