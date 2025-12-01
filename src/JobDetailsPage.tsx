// JobDetailsPage.tsx — AUTO FILTER by Qualification + Skills + Experience
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JobDetailsPage: React.FC = () => {
  const navigate = useNavigate();

  // ⭐ Load logged-in user
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  // ⭐ Load auto filters from Dashboard
  const autoFilterRaw = localStorage.getItem("jobFilter");
  const autoFilter = autoFilterRaw ? JSON.parse(autoFilterRaw) : {};

  const userQualification = (user?.qualification || "").toLowerCase();
  const autoSkills = (autoFilter.skills || "").toLowerCase();
  const autoExperience = (autoFilter.experience || "").toLowerCase();

  // ---------------- STATE ----------------
  const [company, setCompany] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Manual filters (optional for user)
  const [jobType] = useState("any");
  const [workMode] = useState("any");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [jobs]);

  // ---------------- FETCH JOBS ----------------
  const fetchJobs = async (requestedPage = 1) => {
    if (!company.trim()) {
      setError("Please enter a company name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:3000/api/rapid-jobs", {
        company: company.trim(),
        page: requestedPage
      });

      if (!res.data.found) {
        setJobs([]);
        setError("No job openings found.");
        return;
      }

      let arr: any[] = res.data.jobs || [];

      // ⭐ AUTO FILTER by Qualification
      if (userQualification) {
        arr = arr.filter((j) =>
          (j.job_description || "").toLowerCase().includes(userQualification)
        );
      }

      // ⭐ AUTO FILTER by Skills
      if (autoSkills) {
        arr = arr.filter((j) =>
          (j.job_description || "").toLowerCase().includes(autoSkills)
        );
      }

      // ⭐ AUTO FILTER by Experience
      if (autoExperience.includes("fresher")) {
        arr = arr.filter((j) => {
          const d = (j.job_description || "").toLowerCase();
          return d.includes("fresher") || d.includes("entry") || d.includes("0-1");
        });
      }

      // ⭐ Manual Skill Filter (optional)
      if (skills.trim() !== "") {
        arr = arr.filter((j) =>
          (j.job_description || "").toLowerCase().includes(skills.toLowerCase())
        );
      }

      // ⭐ Manual Location Filter
      if (location.trim() !== "") {
        arr = arr.filter((j) =>
          `${j.job_city} ${j.job_country}`
            .toLowerCase()
            .includes(location.toLowerCase())
        );
      }

      setJobs(arr);
      setPage(requestedPage);
    } catch {
      setError("Backend error. Please start the server!");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Auto load qualification filter message ----------------
  useEffect(() => {
    if (userQualification || autoSkills || autoExperience) {
      console.log("Auto filters applied:", {
        qualification: userQualification,
        skills: autoSkills,
        experience: autoExperience
      });
    }
  }, []);

  // ---------------- CLEAR ----------------
  const clearAll = () => {
    setCompany("");
    setJobs([]);
    setError("");
    setLocation("");
    setSkills("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") fetchJobs(1);
  };

  // ---------------- JSX ----------------
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f5f1ff,#f9f5ff)"
      }}
    >
      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: 270,
          background: "#ffffff",
          padding: 24,
          boxShadow: "2px 0 10px rgba(15,23,42,0.06)"
        }}
      >
        <h2 style={{ fontWeight: 700, marginBottom: 4 }}>Job Assistant 🔍</h2>
        <p style={{ fontSize: 12, color: "#6b7280" }}>Auto-filter enabled</p>

        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "#eef2ff",
            borderRadius: 10,
            color: "#4f46e5",
            fontWeight: 600,
            fontSize: 13
          }}
        >
          {userQualification && (
            <p>Qualification: {userQualification.toUpperCase()}</p>
          )}
          {autoSkills && <p>Skills: {autoSkills}</p>}
          {autoExperience && <p>Experience: {autoExperience}</p>}
        </div>

        <button
          className="btn purple"
          style={{ width: "100%", marginTop: 15 }}
          onClick={() => navigate("/dashboard")}
        >
          ⬅ Back to Dashboard
        </button>

        <button
          className="btn red"
          style={{ width: "100%", marginTop: 5 }}
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/login");
          }}
        >
          🚪 Logout
        </button>

        <hr style={{ margin: "14px 0" }} />

        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Filters</h3>

        <label style={{ fontSize: 13 }}>Skills</label>
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="filter-input"
        />

        <label style={{ fontSize: 13, marginTop: 8 }}>Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="filter-input"
        />
      </div>

      {/* RIGHT MAIN SIDE */}
      <div style={{ flex: 1, padding: "32px 40px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Job Search Portal 💼</h1>

        {/* Search bar */}
        <div
          style={{
            marginTop: 22,
            padding: 16,
            borderRadius: 18,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search company… (e.g., Google, Infosys)"
            className="search-bar"
            style={{
              flex: 1,
              padding: "14px 22px",
              borderRadius: 999,
              border: "1px solid #e5defe",
              background: "#faf5ff"
            }}
          />
          <button className="btn purple" onClick={() => fetchJobs(1)}>
            🔎 Search
          </button>
        </div>

        {loading && <p style={{ marginTop: 20 }}>Fetching jobs…</p>}
        {error && <p style={{ color: "red", marginTop: 20 }}>{error}</p>}

        <div style={{ marginTop: 20 }}>
          {jobs.map((job, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                padding: 22,
                borderRadius: 18,
                marginBottom: 20,
                borderLeft: "5px solid #8b5cf6",
                boxShadow: "0 6px 20px rgba(15,23,42,0.06)"
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>{job.job_title}</h3>
              <p style={{ marginTop: 6 }}>
                <strong>Company:</strong> {job.employer_name} <br />
                <strong>Location:</strong> {job.job_city}, {job.job_country}
              </p>
              <p style={{ marginTop: 10 }}>
                {(job.job_description || "").slice(0, 300)}…
              </p>

              <a
                href={job.job_apply_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: 10,
                  display: "inline-block",
                  padding: "10px 18px",
                  background: "#10b981",
                  color: "#fff",
                  borderRadius: 999,
                  fontWeight: 600
                }}
              >
                Apply Now →
              </a>
            </div>
          ))}
        </div>

        <div ref={endRef} />
      </div>
    </div>
  );
};

export default JobDetailsPage;
