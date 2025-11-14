import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatPage from "./ChatPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Directly open Chat Page */}
        <Route path="/" element={<ChatPage />} />

        {/* Optional: also allow /chat */}
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
};

export default App;
