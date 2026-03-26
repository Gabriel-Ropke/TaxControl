import { Settings, Sun, User } from "lucide-react";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import "./configurations.css";

export function Configurations() {
  return (
    <>
      <Sidebar />
      <div id="configurationsContainer">
        <header>
          <h2 className="title">Configurações</h2>
          <div className="toggle-mode"></div>
        </header>
        <section id="configurationsContainer">
          <nav className="config-list">
            <ul>
              <li>
                <User />
                <span>Perfil</span>
              </li>
              <li>
                <Sun />
                <span>Aparência</span>
              </li>
              <li>
                <Settings />
                <span>Sistema</span>
              </li>
            </ul>
          </nav>
        </section>
      </div>
    </>
  );
}
