import "./sidebar.css";
import { House, Building2, BarChart2, Settings, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import pfp from "../../assets/pfp.jpeg";

const navItems = [
  { label: "Home", path: "/home", icon: House },
  { label: "Empresas", path: "/enterprises", icon: Building2 },
  { label: "Relatórios", path: "/reports", icon: BarChart2 },
  { label: "Configurações", path: "/configurations", icon: Settings },
];

export function Sidebar() {
  const [activeSidebar, setActiveSidebar] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      activeSidebar ? "320px" : "100px",
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
          <div className="img-container">
            <img src={pfp} alt="" className="profile-picture" />
          </div>
          <div className="text-container">
            <span className="username">Guilherme</span>
            <span className="user-role">Admin</span>
          </div>
        </div>
      </aside>
    </>
  );
}
