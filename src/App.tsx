import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import DashboardPage from "./DashboardPage";
import ChatPage from "./ChatPage";
import JobDetailsPage from "./JobDetailsPage";
import EditProfilePage from "./EditProfilePage";

const Protected = ({ children }: { children: JSX.Element }) => {
  const user = localStorage.getItem("user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/chat" element={<Protected><ChatPage /></Protected>} />
      <Route path="/jobs" element={<Protected><JobDetailsPage /></Protected>} />

      {/* NEW - edit profile */}
      <Route path="/edit-profile" element={<Protected><EditProfilePage /></Protected>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
