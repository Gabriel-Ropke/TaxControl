import "./sidebar.css";
import { House, Building2, BarChart2, Settings, Menu, LogOut, X } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLayout } from "../../contexts/LayoutContext";

const navItems = [
  { label: "Home", path: "/home", icon: House },
  { label: "Empresas", path: "/enterprises", icon: Building2 },
  { label: "Relatórios", path: "/reports", icon: BarChart2 },
  { label: "Configurações", path: "/configurations", icon: Settings },
];

export function Sidebar() {
  const { signOut } = useAuth();
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const prefsToRemove = ['theme', 'accentColor', 'accentColorObj', 'currency', 'sidebarState'];
    prefsToRemove.forEach(key => localStorage.removeItem(key));
    await signOut();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    
    // Seta largura pra 0 no mobile pra liberar espaço na página
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isMobile ? "0px" : (isSidebarOpen ? "250px" : "100px")
    );
  }, [isSidebarOpen]);

  // Fecha o sidebar ao navegar no mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  }, [location.pathname]);

  return (
    <>
      {/* Overlay para mobile */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <aside className={isSidebarOpen ? "active" : ""}>
        <div onClick={toggleSidebar} className="top">
          <Menu size={40} className="menu" />
          <div className="sidebar-logo">
            <h2>TaxControl</h2>
            <span>Gestão de Impostos</span>
          </div>
          <button className="close-sidebar-mobile" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav>
          <ul>
            {navItems.map(({ label, path, icon: Icon }) => (
              <li
                key={path}
                className={`${location.pathname === path ? "active" : "hoverTextDecorationEffect"}`}
                onClick={() => navigate(path)}
              >
                <Icon size={24} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </nav>
        <div className="bottom">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
