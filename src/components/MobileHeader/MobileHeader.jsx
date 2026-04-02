import "./mobileHeader.css";
import { Menu } from "lucide-react";
import { useLayout } from "../../contexts/LayoutContext";

export function MobileHeader() {
  const { toggleSidebar } = useLayout();

  return (
    <header className="mobile-header">
      <button className="hamburger-menu" onClick={toggleSidebar}>
        <Menu size={28} />
      </button>
      <div className="mobile-logo">
        <h1>TaxControl</h1>
      </div>
      <div className="header-spacer" />
    </header>
  );
}
