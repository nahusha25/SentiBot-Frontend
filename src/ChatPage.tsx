// ChatPage.tsx – Pro SentiBot (Full Version A)
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  sentiment?: string;
  intensity?: string;
  emotion?: string;
  confidence?: number;
  confidenceExplanation?: string;
  advice?: string;
  crisis?: boolean;
  followUp?: string;
  cbtQuestion?: string;
  suggestions?: string[];
  extra?: {
    quote?: string;
    mapsLink?: string;
    helplines?: string[];
  };
};

type FilterType = "all" | "user" | "bot";

type MoodSummary = {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  emotions: Record<string, number>;
  trend: "improving" | "worsening" | "stable" | "no-data" | string;
  last7Days: Array<{
    date: string;
    score: number;
    sentiment: string;
    emotion: string;
  }>;
};

type WellnessTip = {
  category: string;
  tip: string;
  generatedAt: string;
};

const STORAGE_KEY = "sentibot_messages_v_final";
const THEME_KEY = "sentibot_theme_v_final";

const ChatPage: React.FC = () => {
  const navigate = useNavigate();

  // ---------- Auth guard ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // ---------- State ----------
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const raw = localStorage.getItem(THEME_KEY);
    return raw ? JSON.parse(raw) : false;
  });
  const [filter, setFilter] = useState<FilterType>("all");
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const [summary, setSummary] = useState<MoodSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [tip, setTip] = useState<WellnessTip | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // ---------- Local storage: load ----------
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setMessages(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // ---------- Local storage: persist chat ----------
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------- Persist theme ----------
  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(darkMode));
  }, [darkMode]);

  // ---------- Scroll button logic ----------
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handler = () => {
      const nearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        120;
      setShowScrollBtn(!nearBottom);
    };

    container.addEventListener("scroll", handler);
    return () => container.removeEventListener("scroll", handler);
  }, []);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  // ---------- Backend: overview summary + tip ----------
  const fetchOverview = async () => {
    try {
      setSummaryLoading(true);
      const [sumRes, tipRes] = await Promise.all([
        fetch("http://localhost:3000/api/mood-summary").catch(() => null),
        fetch("http://localhost:3000/api/wellness-tip").catch(() => null),
      ]);

      if (sumRes && sumRes.ok) {
        const summaryData = await sumRes.json();
        setSummary(summaryData);
      }

      if (tipRes && tipRes.ok) {
        const tipData = await tipRes.json();
        setTip(tipData);
      }
    } catch (err) {
      console.error("Overview fetch failed", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.sender === "bot") {
      fetchOverview();
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Export chat ----------
  const exportChat = () => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups to export the chat.");
      return;
    }
    w.document.write("<h2>SentiBot Chat Export</h2>");
    messages.forEach((m) => {
      w.document.write(
        `<div><b>${m.sender === "user" ? "You" : "SentiBot"}</b> - ${new Date(
          m.timestamp
        ).toLocaleString()}<pre>${m.text}</pre>`
      );
      if (m.extra) {
        if (m.extra.quote) {
          w.document.write(`<div><b>Quote:</b> ${m.extra.quote}</div>`);
        }
        if (m.extra.helplines) {
          w.document.write(
            `<div><b>Helplines:</b><pre>${m.extra.helplines.join(
              "\n"
            )}</pre></div>`
          );
        }
      }
      w.document.write("</div><hr/>");
    });
    w.print();
  };

  // ---------- Send message ----------
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);
    setTyping(true);

    try {
      const res = await fetch("http://localhost:3000/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: (data.advice || "Thanks for sharing.").trim(),
        sender: "bot",
        timestamp: new Date().toISOString(),
        sentiment: data.sentiment,
        intensity: data.intensity,
        emotion: data.emotion,
        confidence:
          typeof data.confidence === "number" ? data.confidence : undefined,
        confidenceExplanation: data.confidenceExplanation,
        advice: data.advice,
        crisis: !!data.crisis,
        followUp: data.followUp,
        cbtQuestion: data.cbtQuestion,
        suggestions: Array.isArray(data.suggestions)
          ? data.suggestions
          : undefined,
        extra: data.extra,
      };

      const delay =
        600 + Math.min(1200, Math.abs(data.score || 0) * 200);

      setTimeout(() => {
        setMessages((prev) => [...prev, botMsg]);
        setTyping(false);
      }, delay);
    } catch (err) {
      console.error(err);
      alert("Backend offline. Please start your Node.js server.");
      setTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
  };

  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!inputMessage.trim() || isLoading) return;
      sendMessage(inputMessage);
    }
  };

  // ---------- Misc handlers ----------
  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const sentimentStats = (() => {
    const botMessages = messages.filter((m) => m.sender === "bot");
    const pos = botMessages.filter((m) => m.sentiment === "positive").length;
    const neg = botMessages.filter((m) => m.sentiment === "negative").length;
    const neu = botMessages.filter((m) => m.sentiment === "neutral").length;
    return { total: messages.length, pos, neg, neu };
  })();

  const filteredMessages = messages.filter((m) => {
    if (filter === "all") return true;
    if (filter === "user") return m.sender === "user";
    if (filter === "bot") return m.sender === "bot";
    return true;
  });

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const withDateSeparators: (Message | { id: string; separator: string })[] =
    [];
  let lastDateLabel = "";
  filteredMessages.forEach((m) => {
    const label = formatDateLabel(m.timestamp);
    if (label !== lastDateLabel) {
      withDateSeparators.push({ id: `sep-${m.id}`, separator: label });
      lastDateLabel = label;
    }
    withDateSeparators.push(m);
  });

  const renderTrend = (trend: MoodSummary["trend"] | undefined) => {
    if (!trend || trend === "no-data") return "No data yet";
    if (trend === "improving") return "📈 Improving";
    if (trend === "worsening") return "📉 Getting tougher";
    return "➖ Stable";
  };

  // ---------- JSX ----------
  return (
    <div
      className={`h-screen overflow-hidden flex flex-col ${
        darkMode ? "bg-[#05010a] text-gray-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Top bar */}
      <header
        className={`border-b backdrop-blur sticky top-0 z-20 ${
          darkMode
            ? "bg-black/70 border-slate-800"
            : "bg-white/70 border-slate-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center text-2xl shadow-md">
              🤖
            </div>
            <div>
              <h1 className="font-semibold text-lg">
                SentiBot – Sentiment & Wellbeing
              </h1>
              <p className="text-xs opacity-70">
                Private chatbot that turns your feelings into insights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-1 ${
                darkMode
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-300 bg-slate-50"
              }`}
            >
              <span className="text-lg">
                {darkMode ? "🌙" : "☀️"}
              </span>
              <span>{darkMode ? "Dark" : "Light"} mode</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Body: fixed height, only inner parts scroll */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 lg:py-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`w-full lg:w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-1 ${
            darkMode ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {/* Mood summary */}
          <div
            className={`rounded-2xl border shadow-sm p-4 ${
              darkMode ? "bg-[#06030f] border-slate-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Mood summary</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                {summaryLoading
                  ? "Loading..."
                  : (summary?.total ?? sentimentStats.total) === 0
                  ? "No data yet"
                  : "Live"}
              </span>
            </div>

            <p className="text-xs opacity-75 mb-3">
              Based on your conversations with SentiBot.
            </p>

            <div className="flex items-center justify-between text-xs mb-3 gap-2">
              <div className="flex flex-col">
                <span className="opacity-70">Total messages</span>
                <span className="text-base font-semibold">
                  {summary?.total ?? sentimentStats.total}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] opacity-70">Positive</span>
                <span className="text-sm text-emerald-500 font-semibold">
                  {summary?.positive ?? sentimentStats.pos}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] opacity-70">Neutral</span>
                <span className="text-sm text-blue-500 font-semibold">
                  {summary?.neutral ?? sentimentStats.neu}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] opacity-70">Negative</span>
                <span className="text-sm text-rose-500 font-semibold">
                  {summary?.negative ?? sentimentStats.neg}
                </span>
              </div>
            </div>

            {/* tiny bar */}
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-200/40 dark:bg-slate-900/80 flex mb-2">
              {(() => {
                const pos = summary?.positive ?? sentimentStats.pos;
                const neu = summary?.neutral ?? sentimentStats.neu;
                const neg = summary?.negative ?? sentimentStats.neg;
                const total = pos + neu + neg || 1;
                return (
                  <>
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${(pos / total) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(neu / total) * 100}%` }}
                    />
                    <div
                      className="bg-rose-500"
                      style={{ width: `${(neg / total) * 100}%` }}
                    />
                  </>
                );
              })()}
            </div>

            <p className="text-[11px] opacity-80">
              Trend:{" "}
              <span className="font-semibold">
                {renderTrend(summary?.trend)}
              </span>
            </p>

            {summary && summary.total > 0 && (
              <>
                <h3 className="text-xs font-semibold mt-3 mb-1">
                  Emotion frequency
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(summary.emotions).map(([emo, count]) => (
                    <span
                      key={emo}
                      className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-[11px] border border-slate-200/70 dark:border-slate-700"
                    >
                      {emo}: {count}
                    </span>
                  ))}
                </div>
              </>
            )}

            {summary && summary.last7Days?.length > 0 && (
              <>
                <h3 className="text-xs font-semibold mt-3 mb-1">
                  Last 7 days
                </h3>
                <div className="flex gap-1.5 overflow-x-auto pt-1">
                  {summary.last7Days.map((day, i) => (
                    <div
                      key={i}
                      className="min-w-[70px] rounded-xl border px-2 py-1.5 text-center bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700"
                    >
                      <div className="text-[10px] opacity-70">
                        {new Date(day.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          day.sentiment === "positive"
                            ? "text-emerald-500"
                            : day.sentiment === "negative"
                            ? "text-rose-500"
                            : "text-slate-500"
                        }`}
                      >
                        {day.sentiment}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick actions */}
          <div
            className={`rounded-2xl border shadow-sm p-4 space-y-2 ${
              darkMode ? "bg-[#06030f] border-slate-800" : "bg-white"
            }`}
          >
            <h3 className="text-sm font-semibold mb-1">Quick actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setInputMessage(
                    "I feel calm, grateful and happy today. Things are going well."
                  )
                }
                className="px-3 py-1.5 text-xs rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                Example positive
              </button>
              <button
                onClick={() =>
                  setInputMessage(
                    "I'm stressed, overwhelmed and feeling low. Nothing seems to work."
                  )
                }
                className="px-3 py-1.5 text-xs rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Example negative
              </button>
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 text-xs rounded-full border border-slate-400/60 hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors"
              >
                Clear history
              </button>
              <button
                onClick={exportChat}
                className="px-3 py-1.5 text-xs rounded-full border border-slate-400/60 hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors"
              >
                Export chat (PDF/Print)
              </button>
            </div>

            <p className="text-[11px] mt-2 opacity-70">
              Tip: Press <kbd>Enter</kbd> to send,{" "}
              <kbd>Shift + Enter</kbd> to add a new line.
            </p>
          </div>

          {/* Wellness tip */}
          {tip && (
            <div
              className={`rounded-2xl border shadow-sm p-4 text-xs ${
                darkMode ? "bg-[#06030f] border-slate-800" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold">🌿 Wellness tip</h3>
                <span className="text-[10px] opacity-60">
                  {new Date(tip.generatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-[11px] mb-1 opacity-80">{tip.category}</p>
              <p className="text-xs">{tip.tip}</p>
            </div>
          )}

          {/* Filters */}
          <div
            className={`rounded-2xl border shadow-sm p-3 ${
              darkMode ? "bg-[#06030f] border-slate-800" : "bg-white"
            }`}
          >
            <span className="text-xs font-semibold block mb-2">
              View
            </span>
            <div className="flex gap-2">
              <button
                className={`flex-1 text-xs px-2 py-1.5 rounded-full border ${
                  filter === "all"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                onClick={() => setFilter("all")}
              >
                All messages
              </button>
              <button
                className={`flex-1 text-xs px-2 py-1.5 rounded-full border ${
                  filter === "user"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                onClick={() => setFilter("user")}
              >
                You
              </button>
              <button
                className={`flex-1 text-xs px-2 py-1.5 rounded-full border ${
                  filter === "bot"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                onClick={() => setFilter("bot")}
              >
                SentiBot
              </button>
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <section
          className={`relative flex-1 flex flex-col rounded-3xl border shadow-sm overflow-hidden ${
            darkMode
              ? "bg-[#05010a] border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Chat header */}
          <div
            className={`px-5 py-3 border-b flex items-center justify-between ${
              darkMode ? "border-slate-800" : "border-slate-100"
            }`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Private check-in</span>
              <span className="text-xs opacity-70">
                Share how you feel. SentiBot responds with sentiment, advice,
                quotes, helplines and reflections.
              </span>
            </div>
            {typing && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                <span className="relative flex h-2 w-6 items-center justify-between">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
                </span>
                <span>SentiBot is typing…</span>
              </div>
            )}
          </div>

          {/* Messages (only this scrolls) */}
          <div
            ref={scrollContainerRef}
            className="flex-1 px-4 sm:px-6 py-4 space-y-4 overflow-y-auto scroll-smooth"
          >
            {filteredMessages.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-full text-center text-sm text-slate-500">
                <div>
                  <p className="mb-2 font-medium">
                    Welcome to SentiBot 👋
                  </p>
                  <p className="text-xs">
                    Start by typing how you feel, or use one of the example
                    buttons on the left.
                  </p>
                </div>
              </div>
            )}

            {withDateSeparators.map((item) => {
              if ("separator" in item) {
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-center my-3"
                  >
                    <span className="px-3 py-1 text-[11px] rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200/60 dark:border-slate-800/80">
                      {item.separator}
                    </span>
                  </div>
                );
              }

              const m = item;
              const isUser = m.sender === "user";

              return (
                <div
                  key={m.id}
                  className={`flex w-full ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-xl gap-2 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="mt-1">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                          isUser
                            ? "bg-gradient-to-br from-purple-500 to-indigo-500 text-white"
                            : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      >
                        {isUser ? "You" : "🤖"}
                      </div>
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl text-base leading-relaxed shadow-sm border ${
                        isUser
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent"
                          : darkMode
                          ? "bg-[#070212] border-slate-800 text-slate-100"
                          : "bg-white border-slate-200"
                      }`}
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {/* Bot labels */}
                      {!isUser &&
                        (m.sentiment || m.emotion || m.intensity) && (
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] opacity-80">
                            {m.sentiment && (
                              <span
                                className={`px-2 py-0.5 rounded-full border ${
                                  m.sentiment === "positive"
                                    ? "border-emerald-400 text-emerald-300 bg-emerald-400/10"
                                    : m.sentiment === "negative"
                                    ? "border-rose-400 text-rose-300 bg-rose-400/10"
                                    : "border-sky-400 text-sky-300 bg-sky-400/10"
                                }`}
                              >
                                {m.sentiment.toUpperCase()}
                              </span>
                            )}
                            {m.emotion && (
                              <span className="px-2 py-0.5 rounded-full border border-indigo-400 text-indigo-200 bg-indigo-400/10">
                                {m.emotion}
                              </span>
                            )}
                            {m.intensity && (
                              <span className="px-2 py-0.5 rounded-full border border-amber-400 text-amber-200 bg-amber-400/10">
                                {m.intensity}
                              </span>
                            )}
                            {typeof m.confidence === "number" && (
                              <span className="opacity-80">
                                Confidence: {m.confidence}%
                              </span>
                            )}
                            {m.crisis && (
                              <span className="px-2 py-0.5 rounded-full border border-red-400 text-red-200 bg-red-500/15">
                                ⚠ Crisis-sensitive reply
                              </span>
                            )}
                          </div>
                        )}

                      {/* Main text */}
                      <div>{m.text}</div>

                      {/* Confidence explanation */}
                      {!isUser && m.confidenceExplanation && (
                        <div className="mt-1 text-[10px] opacity-70">
                          {m.confidenceExplanation}
                        </div>
                      )}

                      {/* Extra mental health info */}
                      {!isUser && m.extra && (
                        <div
                          className={`mt-3 rounded-xl border text-xs space-y-1.5 px-3 py-2 ${
                            isUser
                              ? "border-white/30 bg-white/10"
                              : darkMode
                              ? "border-slate-700 bg-slate-900/60"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          {m.extra.quote && (
                            <div>
                              <span className="font-semibold">🌱 Quote:</span>{" "}
                              {m.extra.quote}
                            </div>
                          )}
                          {m.extra.mapsLink && (
                            <div>
                              <span className="font-semibold">
                                🧠 Nearby help:
                              </span>{" "}
                              <a
                                href={m.extra.mapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2"
                              >
                                Find a nearby psychiatrist
                              </a>
                            </div>
                          )}
                          {m.extra.helplines && (
                            <div>
                              <span className="font-semibold">
                                ☎ Helplines:
                              </span>
                              <pre className="mt-1 whitespace-pre-wrap">
                                {m.extra.helplines.join("\n")}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CBT / suggestions */}
                      {!isUser &&
                        (m.followUp ||
                          m.cbtQuestion ||
                          (m.suggestions && m.suggestions.length > 0)) && (
                          <div
                            className={`mt-3 rounded-xl border text-xs space-y-1.5 px-3 py-2 ${
                              darkMode
                                ? "border-slate-700 bg-slate-900/70"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            {m.followUp && (
                              <div>
                                <span className="font-semibold">
                                  Next step:
                                </span>{" "}
                                {m.followUp}
                              </div>
                            )}
                            {m.cbtQuestion && (
                              <div>
                                <span className="font-semibold">
                                  Reflection:
                                </span>{" "}
                                {m.cbtQuestion}
                              </div>
                            )}
                            {m.suggestions && m.suggestions.length > 0 && (
                              <div>
                                <span className="font-semibold">
                                  Suggestions:
                                </span>
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                  {m.suggestions.map((sug, idx) => (
                                    <li key={idx}>{sug}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Time */}
                      <div className="mt-2 text-[10px] opacity-70 flex justify-end">
                        {formatTime(m.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-300">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-2.5 w-40 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-2.5 w-28 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-7 z-10 rounded-full bg-slate-900 text-white text-xs px-3 py-1.5 shadow-lg flex items-center gap-1 hover:bg-slate-800 transition-colors"
            >
              ↓ New messages
            </button>
          )}

          {/* Input bar */}
          <div
            className={`border-t px-3 sm:px-5 py-3 ${
              darkMode ? "border-slate-800 bg-[#04000a]" : "bg-slate-50"
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 sm:gap-3"
            >
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={onKeyDownInput}
                placeholder="Type a message about how you feel…"
                className={`flex-1 text-sm px-4 py-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500/70 ${
                  darkMode
                    ? "bg-[#05010f] border-slate-700 text-slate-100 placeholder:text-slate-500"
                    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className={`px-4 sm:px-5 py-2.5 text-sm rounded-full font-medium flex items-center gap-1 shadow-sm transition-colors ${
                  isLoading || !inputMessage.trim()
                    ? "bg-purple-300 text-white cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <span>Send</span>
                <span>↩</span>
              </button>
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className={`hidden sm:inline-flex px-3 py-2.5 text-sm rounded-full border ${
                  darkMode
                    ? "border-slate-700 text-slate-300"
                    : "border-slate-300 text-slate-600"
                }`}
                title="Voice input coming soon"
              >
                🎤
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
