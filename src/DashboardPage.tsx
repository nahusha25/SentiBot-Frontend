import React from "react";
import { useNavigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // SAFELY read user from localStorage
  let user: any = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  // If no user → redirect to login
  if (!user || !user.name) {
    navigate("/login");
    return null;
  }

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Auto-filter Job Portal
  const openJobPortal = () => {
    localStorage.setItem(
      "jobFilter",
      JSON.stringify({
        skills: user.skills || "",
        qualification: user.qualification || "",
        experience: user.experience || ""
      })
    );

    navigate("/jobs");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Top Bar */}
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10">

        {/* Profile Card */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border mb-10">
          <h2 className="text-3xl font-semibold">
            Welcome back, <span className="text-purple-600">{user.name}</span> 👋
          </h2>

          <p className="mt-3 text-gray-700 text-lg font-medium">Your Profile</p>

          <div className="mt-4 space-y-2 text-gray-600">
            <p><strong>Email:</strong> {user.email || "Not Provided"}</p>
            <p><strong>City:</strong> {user.city || "Not Provided"}</p>
            <p><strong>Date of Birth:</strong> {user.date_of_birth || "Not Provided"}</p>
            <p><strong>Qualification:</strong> {user.qualification || "Not Provided"}</p>
            <p><strong>Skills:</strong> {user.skills || "Not Provided"}</p>
            <p><strong>Experience:</strong> {user.experience || "Not Provided"}</p>
            <p><strong>Career Goal:</strong> {user.career_goal || "Not Provided"}</p>
          </div>

          {/* Edit Profile */}
          <button
            onClick={() => navigate("/edit-profile")}
            className="mt-5 px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
          >
            ✏️ Edit Profile
          </button>

          <p className="mt-3 text-gray-500 text-sm">Choose an option to continue.</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Chatbot */}
          <div
            className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-xl cursor-pointer hover:scale-[1.02] transition"
            onClick={() => navigate("/chat")}
          >
            <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              🤖 SentiBot
            </h3>
            <p className="opacity-90">
              Your AI assistant for emotional support and wellbeing.
            </p>
          </div>

          {/* Job Portal */}
          <div
            className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl p-8 shadow-xl cursor-pointer hover:scale-[1.02] transition"
            onClick={openJobPortal}
          >
            <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              💼 Job Search Portal
            </h3>
            <p className="opacity-90">
              Jobs matched automatically using your skills & qualification.
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
