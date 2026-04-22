import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Package, PlusCircle, ClipboardList, Settings, LogOut, LayoutDashboard, RefreshCw } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/admin", icon: LayoutDashboard, label: "Panel de Control" },
  { to: "/admin/products", icon: Package, label: "Productos" },
  { to: "/admin/products/new", icon: PlusCircle, label: "Agregar producto" },
  { to: "/admin/orders", icon: ClipboardList, label: "Pedidos" },
  { to: "/admin/settings", icon: Settings, label: "Configuración" },
  { to: "/admin/migration", icon: RefreshCw, label: "Migrar Imágenes" },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-card border-r">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight text-primary font-heading">PANEL DISTEC</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                }`
              }
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
