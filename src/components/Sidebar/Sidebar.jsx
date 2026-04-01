import "./sidebar.css";
import { House, Building2, BarChart2, Settings, Menu, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { label: "Home", path: "/home", icon: House },
  { label: "Empresas", path: "/enterprises", icon: Building2 },
  { label: "Relatórios", path: "/reports", icon: BarChart2 },
  { label: "Configurações", path: "/configurations", icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [activeSidebar, setActiveSidebar] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const prefsToRemove = ['theme', 'accentColor', 'accentColorObj', 'currency', 'sidebarState'];
    prefsToRemove.forEach(key => localStorage.removeItem(key));
    await signOut();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      activeSidebar ? "250px" : "100px",
    );
  }, [activeSidebar]);

  const handleActiveSidebar = () => {
    setActiveSidebar((prev) => !prev);
  };

  return (
    <>
      <aside className={activeSidebar ? "active" : ""}>
        <div onClick={handleActiveSidebar} className="top">
          <Menu size={40} className="menu" />
          <h2>TaxControl</h2>
          <span>Gestão de Impostos</span>
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
