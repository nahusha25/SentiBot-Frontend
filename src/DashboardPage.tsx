import React from "react";
import { useNavigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const profileRaw = localStorage.getItem("profile");
  const profile = profileRaw
    ? JSON.parse(profileRaw)
    : { name: "User", qualification: "Not Provided" };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-700">SentiBot Dashboard</h1>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10">
        {/* Welcome Card */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border mb-10">
          <h2 className="text-3xl font-semibold">
            Welcome back, <span className="text-purple-600">{profile.name}</span> 👋
          </h2>
          <p className="mt-2 text-gray-600">
            Qualification: <strong>{profile.qualification}</strong>
          </p>
          <p className="mt-1 text-gray-500 text-sm">Choose an option to continue.</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* SentiBot Card */}
          <div
            className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-xl cursor-pointer hover:scale-[1.02] transition"
            onClick={() => navigate("/chat")}
          >
            <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              🤖 SentiBot
            </h3>
            <p className="opacity-90">
              Your personal AI for emotional wellbeing, mental support, and motivational insights.
            </p>
          </div>

          {/* Job Portal Card */}
          <div
            className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl p-8 shadow-xl cursor-pointer hover:scale-[1.02] transition"
            onClick={() => navigate("/jobs")}
          >
            <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              💼 Job Search Portal
            </h3>
            <p className="opacity-90">
              Explore job openings, track roles, and get updated listings powered by RapidAPI.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 mt-12">
          © {new Date().getFullYear()} SentiBot • All Rights Reserved
        </footer>
      </main>
    </div>
  );
};

export default DashboardPage;
