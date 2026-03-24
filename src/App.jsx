import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/login/Login";
import { Home } from "./pages/home/home";
import { Enterprises } from "./pages/enterprises/Enterprises";
import { Enterprise } from "./pages/enterprise/Enterprise";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/enterprises" element={<Enterprises />} />
        <Route path="/enterprise/:id" element={<Enterprise />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
