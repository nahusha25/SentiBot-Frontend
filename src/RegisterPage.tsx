import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [qualification, setQualification] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !qualification || !password) {
      setError("All fields are required!");
      return;
    }

    // Read existing users
    const stored = localStorage.getItem("users");
    const users = stored ? JSON.parse(stored) : [];

    // Check if email exists
    if (users.find((u: any) => u.email === email)) {
      setError("Email already registered! Please login.");
      return;
    }

    // Add new user
    const newUser = { name, email, qualification, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! Please login.");
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3e8ff",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "20px" }}>
          Register
        </h2>

        {error && (
          <p style={{ color: "red", marginBottom: "12px", fontWeight: "500" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} style={{ display: "grid", gap: "12px" }}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <select
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select Qualification</option>
            <option value="BCA">BCA</option>
            <option value="BCom">BCom</option>
            <option value="BBA">BBA</option>
            <option value="MCA">MCA</option>
            <option value="MBA">MBA</option>
          </select>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            style={{
              background: "#7b2cff",
              color: "white",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </form>

        <p style={{ marginTop: "14px" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "#7b2cff", cursor: "pointer", fontWeight: 600 }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

export default RegisterPage;
