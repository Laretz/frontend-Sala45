"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Sala45
          </Link>
          <nav className="hidden md:flex space-x-4">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/meetings" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Reservas
            </Link>
            <Link 
              href="/rooms" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Salas
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {theme === 'light' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </Button>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Olá, {user?.name}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}