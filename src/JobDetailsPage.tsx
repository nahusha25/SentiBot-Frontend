// JobDetailsPage.tsx — Pro UI (Salary Removed + Wide Search Bar)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JobDetailsPage: React.FC = () => {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  const [company, setCompany] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters (Salary Removed)
  const [jobType, setJobType] = useState("any");
  const [experience, setExperience] = useState("any");
  const [workMode, setWorkMode] = useState("any");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

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
    if (requestedPage === 1) setJobs([]);

    try {
      const res = await axios.post("https://sentibot-backend.onrender.com/api/rapid-jobs", {
        company: company.trim(),
        page: requestedPage,
      });

      if (!res.data.found) {
        setJobs([]);
        setTotalCount(0);
        setError("No job openings found for this query.");
      } else {
        let arr: any[] = res.data.jobs || [];

        // ----- Job type -----
        if (jobType !== "any") {
          arr = arr.filter((j) =>
            (j.job_employment_type || "")
              .toLowerCase()
              .includes(jobType.toLowerCase())
          );
        }

        // ----- Work mode -----
        if (workMode !== "any") {
          arr = arr.filter((j) => {
            const desc = `${j.job_description || ""} ${j.job_city || ""} ${
              j.job_country || ""
            }`.toLowerCase();

            const isRemote = j.job_is_remote === true || desc.includes("remote");
            const isHybrid = desc.includes("hybrid");

            if (workMode === "remote") return isRemote;
            if (workMode === "hybrid") return isHybrid;
            if (workMode === "onsite") return !isRemote && !isHybrid;
            return true;
          });
        }

        // ----- Experience -----
        if (experience !== "any") {
          arr = arr.filter((j) => {
            const exp = (j.job_description || "").toLowerCase();

            if (experience === "fresher")
              return (
                exp.includes("fresher") ||
                exp.includes("entry") ||
                exp.includes("0-1")
              );

            if (experience === "1-3") return exp.includes("1-3");
            if (experience === "3-5") return exp.includes("3-5");
            if (experience === "5+") return exp.includes("5") || exp.includes("7");

            return true;
          });
        }

        // ----- Skills -----
        if (skills.trim() !== "") {
          arr = arr.filter((j) =>
            (j.job_description || "")
              .toLowerCase()
              .includes(skills.toLowerCase())
          );
        }

        // ----- Location -----
        if (location.trim() !== "") {
          arr = arr.filter((j) =>
            `${j.job_city || ""} ${j.job_country || ""}`
              .toLowerCase()
              .includes(location.toLowerCase())
          );
        }

        // ----- Sort -----
        if (sortBy === "salaryHigh")
          arr = arr.sort(
            (a, b) => (b.job_max_salary || 0) - (a.job_max_salary || 0)
          );
        if (sortBy === "salaryLow")
          arr = arr.sort(
            (a, b) => (a.job_min_salary || 0) - (b.job_min_salary || 0)
          );

        setJobs(arr);
        setTotalCount(res.data.count || arr.length);
        setPage(requestedPage);
      }
    } catch (err) {
      setError("Backend not running or API request failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CLEAR ALL ----------------
  const clearAll = () => {
    setCompany("");
    setJobs([]);
    setError("");
    setTotalCount(0);
    setPage(1);
    setJobType("any");
    setExperience("any");
    setWorkMode("any");
    setLocation("");
    setSkills("");
    setSortBy("relevance");
  };

  // ---------------- ENTER KEY SEARCH ----------------
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchJobs(1);
    }
  };

  // ---------------- JSX ----------------
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
          width: 270,
          background: "#ffffff",
          padding: 24,
          boxShadow: "2px 0 10px rgba(15,23,42,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontWeight: 700,
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Job Assistant 🔍
          </h2>
          <p style={{ fontSize: 12, color: "#6b7280" }}>
            Filter roles and track the best opportunities.
          </p>
        </div>

        <button
          className="btn purple"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => navigate("/dashboard")}
        >
          ⬅ Back to Dashboard
        </button>

        <button
          className="btn red"
          style={{ width: "100%" }}
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          🚪 Logout
        </button>

        <hr style={{ margin: "14px 0", borderColor: "#e5e7eb" }} />

        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          Filters
        </h3>

        {/* Job type */}
        <label style={{ fontSize: 13 }}>Job type</label>
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="filter-input"
        >
          <option value="any">Any</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>

        {/* Experience */}
        <label style={{ fontSize: 13, marginTop: 4 }}>Experience</label>
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="filter-input"
        >
          <option value="any">Any</option>
          <option value="fresher">Fresher</option>
          <option value="1-3">1–3 years</option>
          <option value="3-5">3–5 years</option>
          <option value="5+">5+ years</option>
        </select>

        {/* Work mode */}
        <label style={{ fontSize: 13, marginTop: 4 }}>Work mode</label>
        <select
          value={workMode}
          onChange={(e) => setWorkMode(e.target.value)}
          className="filter-input"
        >
          <option value="any">Any</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>

        {/* Location */}
        <label style={{ fontSize: 13, marginTop: 4 }}>Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="filter-input"
          placeholder="City / Country"
        />

        {/* Skills */}
        <label style={{ fontSize: 13, marginTop: 4 }}>Skills</label>
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="filter-input"
          placeholder="React, Java, Python…"
        />

        {/* Sort */}
        <label style={{ fontSize: 13, marginTop: 4 }}>Sort by</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-input"
        >
          <option value="relevance">Relevance</option>
          <option value="salaryHigh">Salary: High → Low</option>
          <option value="salaryLow">Salary: Low → High</option>
        </select>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          padding: "32px 40px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1200 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Job Search Portal <span>💼</span>
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                Search roles by company, fine-tune filters and quickly apply to
                matching openings.
              </p>
            </div>

            <button
              className="btn clear"
              onClick={clearAll}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ✖ Clear Search
            </button>
          </div>

          {/* Search card */}
          <div
            style={{
              marginTop: 22,
              padding: 16,
              borderRadius: 18,
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search company… (e.g., Google, Infosys, TCS)"
              className="search-bar"
              style={{
                flex: 1,
                padding: "14px 22px",
                borderRadius: 999,
                border: "1px solid #e5defe",
                outline: "none",
                fontSize: 15,
                background: "#faf5ff",
              }}
            />

            <button
              className="btn purple"
              onClick={() => fetchJobs(1)}
              style={{
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              🔎 Search
            </button>
          </div>

          {/* Status & summary */}
          {loading && (
            <p style={{ marginTop: 18, fontSize: 14 }}>Fetching jobs…</p>
          )}
          {error && (
            <p
              style={{
                marginTop: 18,
                color: "#dc2626",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              {error}
            </p>
          )}

          {!loading && !error && jobs.length === 0 && company.trim() !== "" && (
            <p
              style={{
                marginTop: 18,
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              No results yet. Try a different company name or relax some
              filters.
            </p>
          )}

          {jobs.length > 0 && (
            <div
              style={{
                marginTop: 18,
                fontSize: 13,
                color: "#6b7280",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                Showing <strong>{jobs.length}</strong> result
                {jobs.length > 1 ? "s" : ""} (Total: {totalCount})
              </span>
              <span style={{ fontSize: 12 }}>Page {page}</span>
            </div>
          )}

          {/* Job results */}
          <div style={{ marginTop: 18 }}>
            {jobs.map((job, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  padding: 22,
                  borderRadius: 18,
                  marginBottom: 18,
                  boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
                  borderLeft: "5px solid #8b5cf6",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        marginBottom: 6,
                        fontSize: 18,
                        fontWeight: 600,
                      }}
                    >
                      {job.job_title}
                    </h3>
                    <div
                      style={{
                        color: "#4b5563",
                        fontSize: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span>
                        <strong>Company:</strong> {job.employer_name}
                      </span>
                      <span>
                        <strong>Location:</strong> {job.job_city},{" "}
                        {job.job_country}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      alignItems: "flex-end",
                      fontSize: 11,
                    }}
                  >
                    {job.job_employment_type && (
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#eef2ff",
                          color: "#4f46e5",
                          fontWeight: 500,
                        }}
                      >
                        {job.job_employment_type}
                      </span>
                    )}
                    {job.job_is_remote && (
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#ecfdf5",
                          color: "#059669",
                          fontWeight: 500,
                        }}
                      >
                        Remote
                      </span>
                    )}
                  </div>
                </div>

                <p
                  style={{
                    color: "#4b5563",
                    marginTop: 10,
                    marginBottom: 12,
                    fontSize: 14,
                  }}
                >
                  {(job.job_description || "").slice(0, 350)}…
                </p>

                <a
                  href={job.job_apply_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#10b981",
                    color: "#ffffff",
                    padding: "9px 16px",
                    borderRadius: 999,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Apply Now →
                </a>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {jobs.length > 0 && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <div>Results: {totalCount}</div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => fetchJobs(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="btn small"
                  style={{ opacity: page <= 1 ? 0.6 : 1 }}
                >
                  ← Prev
                </button>

                <button onClick={() => fetchJobs(page + 1)} className="btn small">
                  Next →
                </button>
              </div>

              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
