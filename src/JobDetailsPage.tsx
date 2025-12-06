// JobDetailsPage.tsx — AUTO JOB LOADER + PAGINATION + OPTIONAL SEARCH
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JobDetailsPage: React.FC = () => {
  const navigate = useNavigate();

  // Load logged-in user
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const qualification = user?.qualification || "";
  const experience = user?.experience || "";
  const skillsFromUser = user?.skills || "";

  // ------------------ STATES ------------------
  const [jobs, setJobs] = useState<any[]>([]);
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [jobs]);

  // ----------------------------------------------------
  // AUTO LOAD JOBS FOR USER PROFILE
  // ----------------------------------------------------
  const loadAutoJobs = async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auto-jobs", {
        qualification,
        experience,
        skills: skillsFromUser,
        page: pageNumber,
      });

      if (res.data.success) {
        setJobs(res.data.jobs);
        setPage(pageNumber);
        setHasNext(res.data.nextPage !== null);
      } else {
        setJobs([]);
        setError("No jobs found for your profile.");
      }
    } catch (err) {
      setError("Backend error — check server.");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAutoJobs();
  }, []);

  // ----------------------------------------------------
  // OPTIONAL SEARCH FUNCTION
  // ----------------------------------------------------
  const fetchJobs = async () => {
    if (!company.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/rapid-jobs", {
        company: company.trim(),
        page: 1,
      });

      if (!res.data.found) {
        setJobs([]);
        setError("No job openings found.");
        return;
      }

      setJobs(res.data.jobs);
      setHasNext(false); // search results do not paginate

    } catch {
      setError("Backend error. Please start the server.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------- JSX -------------------------
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f5f1ff,#f9f5ff)",
      }}
    >
      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: 260,
          background: "#ffffff",
          padding: 22,
          boxShadow: "2px 0 10px rgba(15,23,42,0.06)",
        }}
      >
        <h2>Job Assistant 🔍</h2>
        <p style={{ fontSize: 12, color: "#6b7280" }}>Auto-match enabled</p>

        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "#eef2ff",
            borderRadius: 10,
            color: "#4f46e5",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <p>Qualification: {qualification}</p>
          <p>Experience: {experience}</p>
          {skillsFromUser && <p>Skills: {skillsFromUser}</p>}
        </div>

        <button
          style={{ marginTop: 15, width: "100%" }}
          onClick={() => navigate("/dashboard")}
          className="btn purple"
        >
          ⬅ Back to Dashboard
        </button>

        <button
          style={{ marginTop: 5, width: "100%" }}
          className="btn red"
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* MAIN RIGHT SIDE */}
      <div style={{ flex: 1, padding: "32px 40px" }}>
        <h1>Recommended Jobs For You 💼</h1>

        {/* SEARCH BAR */}
        <div
          style={{
            marginTop: 22,
            padding: 12,
            borderRadius: 16,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <input
            placeholder="Search company… (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{
              flex: 1,
              padding: "14px 22px",
              borderRadius: 999,
              border: "1px solid #e5defe",
              background: "#faf5ff",
            }}
          />
          <button className="btn purple" onClick={fetchJobs}>
            🔎 Search
          </button>
        </div>

        {loading && <p style={{ marginTop: 20 }}>Fetching jobs…</p>}
        {error && <p style={{ marginTop: 20, color: "red" }}>{error}</p>}

        {/* JOB CARD LIST */}
        <div style={{ marginTop: 20 }}>
          {jobs.map((job, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 16,
                marginBottom: 20,
                borderLeft: "5px solid #8b5cf6",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              <h3>{job.job_title}</h3>
              <p>
                <strong>Company:</strong> {job.employer_name}
                <br />
                <strong>Location:</strong> {job.job_city}, {job.job_country}
              </p>
              <p>{(job.job_description || "").slice(0, 250)}...</p>

              <a
                href={job.job_apply_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  padding: "8px 16px",
                  background: "#10b981",
                  color: "#fff",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                Apply Now →
              </a>
            </div>
          ))}
        </div>

        {/* PAGINATION BUTTONS */}
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          {page > 1 && (
            <button
              className="btn purple"
              onClick={() => loadAutoJobs(page - 1)}
              style={{ padding: "10px 18px" }}
            >
              ⬅ Previous Page
            </button>
          )}

          {hasNext && (
            <button
              className="btn purple"
              onClick={() => loadAutoJobs(page + 1)}
              style={{ padding: "10px 18px" }}
            >
              Next Page ➜
            </button>
          )}
        </div>

        <div ref={endRef} />
      </div>
    </div>
  );
};

export default JobDetailsPage;
