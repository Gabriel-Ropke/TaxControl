import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { CurrencyProvider } from "./hooks/useCurrency";
import { useInitPreferences } from "./hooks/useInitPreferences";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { Login } from "./pages/login/Login";
import { AuthCallback } from "./pages/login/AuthCallback";
import { Home } from "./pages/home/home";
import { Enterprises } from "./pages/enterprises/Enterprises";
import { Enterprise } from "./pages/enterprise/Enterprise";
import { ImportData } from "./pages/ImportData/ImportData";
import { BatchEdit } from "./pages/BatchEdit/BatchEdit";
import { Reports } from "./pages/Reports/Reports";
import { Configurations } from "./pages/Configurations/Configurations";
import { LayoutProvider } from "./contexts/LayoutContext";


function App() {
  useInitPreferences();
  
  return (
    <ToastProvider>
      <CurrencyProvider>
        <LayoutProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/enterprises"
                  element={
                    <ProtectedRoute>
                      <Enterprises />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/enterprise/:id"
                  element={
                    <ProtectedRoute>
                      <Enterprise />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/enterprises/import"
                  element={
                    <ProtectedRoute>
                      <ImportData />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/enterprises/batch-edit"
                  element={
                    <ProtectedRoute>
                      <BatchEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configurations"
                  element={
                    <ProtectedRoute>
                      <Configurations />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LayoutProvider>
      </CurrencyProvider>
    </ToastProvider>
  );
}

export default App;
