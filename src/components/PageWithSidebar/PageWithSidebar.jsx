import { Sidebar } from "../Sidebar/Sidebar";
import { MobileHeader } from "../MobileHeader/MobileHeader";

export function PageWithSidebar({ children }) {
  return (
    <>
      <MobileHeader />
      <Sidebar />
      <main className="page-content">
        {children}
      </main>
    </>
  );
}
