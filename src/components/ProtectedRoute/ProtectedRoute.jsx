import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <span style={{ padding: "2rem", display: "block" }}>Carregando...</span>;
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
