import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditProfile: React.FC = () => {
  const navigate = useNavigate();

  // Load saved user
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : {};

  // Form state
  const [name] = useState(user.name || "");
  const [city, setCity] = useState(user.city || "");
  const [qualification, setQualification] = useState(user.qualification || "");
  const [skills, setSkills] = useState(user.skills || "");
  const [experience, setExperience] = useState(user.experience || "");
  const [careerGoal, setCareerGoal] = useState(user.career_goal || "");
  const [dob, setDob] = useState(user.date_of_birth || "");

  const [message, setMessage] = useState("");

  const saveProfile = async () => {
    if (!user.id) {
      setMessage("User ID missing — login again.");
      return;
    }

    try {
      const res = await axios.put("http://localhost:5000/api/update-profile", {
        id: user.id,
        city,
        skills,
        experience,
        career_goal: careerGoal,
        date_of_birth: dob,
        qualification,
      });

      // Update localStorage with new values
      const updated = {
        ...user,
        city,
        skills,
        experience,
        career_goal: careerGoal,
        date_of_birth: dob,
        qualification,
      };

      localStorage.setItem("user", JSON.stringify(updated));

      setMessage("Profile updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setMessage("Server error while updating.");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        Edit Profile
      </h1>

      {message && (
        <p
          style={{
            marginBottom: 20,
            color: message.includes("success") ? "green" : "red",
            fontWeight: 600,
          }}
        >
          {message}
        </p>
      )}

      {/* Name (readonly) */}
      <input
        value={name}
        readOnly
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      />

      {/* City */}
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City"
        style={{
          width: "48%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginRight: "4%",
        }}
      />

      {/* Qualification */}
      <input
        value={qualification}
        onChange={(e) => setQualification(e.target.value)}
        placeholder="Qualification"
        style={{
          width: "48%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      />

      {/* Skills */}
      <input
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        placeholder="Skills"
        style={{
          width: "48%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginRight: "4%",
        }}
      />

      {/* Experience */}
      <input
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        placeholder="Experience"
        style={{
          width: "48%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      />

      {/* DOB */}
      <input
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        style={{
          width: "48%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginRight: "4%",
        }}
      />

      {/* Career goal */}
      <textarea
        value={careerGoal}
        onChange={(e) => setCareerGoal(e.target.value)}
        placeholder="Career Goal"
        style={{
          width: "100%",
          padding: 12,
          height: 120,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      ></textarea>

      {/* Save button */}
      <button
        onClick={saveProfile}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          fontWeight: 600,
          background: "#7a08f0",
          color: "white",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
        }}
      >
        Save Changes
      </button>
    </div>
  );
};

export default EditProfile;
