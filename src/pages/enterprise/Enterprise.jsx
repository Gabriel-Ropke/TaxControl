import { useParams } from "react-router-dom";
import "./enterprise.css";
import { Sidebar } from "../../components/Sidebar/Sidebar";

export function Enterprise() {
  const { id } = useParams();
  return (
    <>
      <Sidebar />
    </>
  );
}
