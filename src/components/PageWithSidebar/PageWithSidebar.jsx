import { Sidebar } from "../Sidebar/Sidebar";

export function PageWithSidebar({ children }) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}
