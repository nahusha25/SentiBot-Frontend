import React, { useState } from "react";

const EditProfilePage: React.FC = () => {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const [form, setForm] = useState({
    name: user?.name || "",
    city: user?.city || "",
    skills: user?.skills || "",
    experience: user?.experience || "",
    career_goal: user?.career_goal || "",
    qualification: user?.qualification || "",
    date_of_birth: user?.date_of_birth || ""
  });

  const [msg, setMsg] = useState("");

  const updateProfile = async () => {
    const res = await fetch(`http://localhost:3000/api/update-profile/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", JSON.stringify({ ...user, ...form }));
      setMsg("Profile updated successfully!");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-purple-600">Edit Profile</h2>

      {msg && <p className="text-green-600 mb-3">{msg}</p>}

      <div className="space-y-3">
        <input className="input" value={form.name} placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="input" value={form.city} placeholder="City"
          onChange={(e) => setForm({ ...form, city: e.target.value })} />

        <input className="input" value={form.qualification} placeholder="Qualification"
          onChange={(e) => setForm({ ...form, qualification: e.target.value })} />

        <input className="input" value={form.skills} placeholder="Skills"
          onChange={(e) => setForm({ ...form, skills: e.target.value })} />

        <input className="input" value={form.experience} placeholder="Experience"
          onChange={(e) => setForm({ ...form, experience: e.target.value })} />

        <textarea className="input" value={form.career_goal} placeholder="Career Goal"
          onChange={(e) => setForm({ ...form, career_goal: e.target.value })}></textarea>

        <input className="input" type="date" value={form.date_of_birth}
          onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />

        <button onClick={updateProfile}
          className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfilePage;
