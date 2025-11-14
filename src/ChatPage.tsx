import React, { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  sentiment?: string;
  confidence?: number;
  advice?: string;
};

const positiveWords = [
  "good","great","happy","joy","love","nice","awesome","excellent","wonderful",
  "fantastic","amazing","pleased","satisfied","calm","relaxed","excited","smile","positive"
];

const negativeWords = [
  "bad","sad","angry","hate","depressed","upset","stress","anxious","terrible",
  "awful","worried","lonely","tired","frustrated","pain","hurt","cry","negative"
];

const neutralWords = ["okay","fine","average","normal","neutral","so-so","meh"];

const STORAGE_KEY = "sentibot_messages_v2";
const THEME_KEY = "sentibot_theme_v2";

const ChatPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const raw = localStorage.getItem(THEME_KEY);
    return raw ? JSON.parse(raw) : true; // default = dark
  });
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // -----------------------------
  // Load Messages on Mount
  // -----------------------------
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

  // -----------------------------
  // Sync Messages to Storage
  // -----------------------------
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -----------------------------
  // Sync Theme to Storage
  // -----------------------------
  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(darkMode));
  }, [darkMode]);

  // -----------------------------
  // Initialize Voice Recognition
  // -----------------------------
  useEffect(() => {
    const win: any = window;
    const SpeechRecognition =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
  }, []);

  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert("Voice recognition not supported.");
      return;
    }
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      rec.start();
      setListening(true);
    }
  };

  // -----------------------------
  // Sentiment Analysis (Lexicon)
  // -----------------------------
  const analyzeSentiment = (text: string) => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    let pos = 0,
      neg = 0,
      neu = 0;

    words.forEach((w) => {
      if (positiveWords.includes(w)) pos++;
      else if (negativeWords.includes(w)) neg++;
      else if (neutralWords.includes(w)) neu++;
    });

    const total = pos + neg + neu;

    if (total === 0) {
      return {
        sentiment: "Neutral 😐",
        confidence: 55,
        advice: "I couldn't detect strong emotion. Tell me more?",
      };
    }

    const polarity = (pos - neg) / total;
    let label = "Neutral 😐";
    if (polarity > 0.2) label = "Positive 😊";
    if (polarity < -0.2) label = "Negative 😞";

    const magnitude = Math.abs(polarity);
    const confidence = Math.round(50 + magnitude * 50);

    let advice = "";
    if (label.startsWith("Positive")) {
      advice = "That's great! Keep doing what makes you happy.";
    } else if (label.startsWith("Negative")) {
      advice =
        "I'm sorry you're feeling low. Try speaking to someone you trust or doing something relaxing.";
    } else {
      advice = "Thanks for sharing. What else would you like to talk about?";
    }

    return { sentiment: label, confidence, advice };
  };

  // -----------------------------
  // Send Message
  // -----------------------------
  const sendMessage = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInputMessage("");

    setTimeout(() => {
      const result = analyzeSentiment(text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sentiment detected: ${result.sentiment}\n\nAdvice: ${result.advice}`,
        sender: "bot",
        timestamp: new Date().toISOString(),
        sentiment: result.sentiment,
        confidence: result.confidence,
        advice: result.advice,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage.trim());
  };

  // -----------------------------
  // Format Time
  // -----------------------------
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // -----------------------------
  // Summary Calculations
  // -----------------------------
  const summary = (() => {
    let pos = 0,
      neg = 0,
      neu = 0;

    for (const m of messages) {
      if (m.sender === "bot" && m.sentiment) {
        if (m.sentiment.startsWith("Positive")) pos++;
        else if (m.sentiment.startsWith("Negative")) neg++;
        else neu++;
      }
    }

    const total = pos + neg + neu;
    return {
      pos,
      neg,
      neu,
      total,
      posPct: total ? Math.round((pos / total) * 100) : 0,
      negPct: total ? Math.round((neg / total) * 100) : 0,
      neuPct: total ? Math.round((neu / total) * 100) : 0,
    };
  })();
  // -----------------------------
  // Pie Chart (SVG - Pure CSS)
  // -----------------------------
  const PieChart: React.FC<{ pos: number; neg: number; neu: number; size?: number }> = ({
    pos,
    neg,
    neu,
    size = 120,
  }) => {
    const total = pos + neg + neu || 1;
    const slices = [
      { value: pos / total, color: "#7c3aed" }, // purple
      { value: neg / total, color: "#ef4444" }, // red
      { value: neu / total, color: "#a3a3a3" }, // gray
    ];

    const radius = size / 2;
    const center = size / 2;

    let cumulative = 0;

    return (
      <svg width={size} height={size}>
        {slices.map((slice, i) => {
          const start = cumulative;
          cumulative += slice.value;
          const end = cumulative;

          const largeArc = slice.value > 0.5 ? 1 : 0;
          const startAngle = start * 2 * Math.PI - Math.PI / 2;
          const endAngle = end * 2 * Math.PI - Math.PI / 2;

          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);

          const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return <path key={i} d={d} fill={slice.color} stroke="black" strokeWidth="0.5" />;
        })}

        <circle
          cx={center}
          cy={center}
          r={radius * 0.55}
          fill={darkMode ? "#000" : "white"}
        />

        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill={darkMode ? "#e2e8f0" : "#1e293b"}
        >
          {summary.total}
        </text>
      </svg>
    );
  };

  // -----------------------------
  // Export PDF = Browser Print View
  // -----------------------------
  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow popups!");

    w.document.write(`
      <html>
      <head>
      <title>SentiBot Export</title>
      <style>
        body { font-family: Arial; padding: 20px; background: white; }
        .msg { margin-bottom: 15px; padding: 10px; border-radius: 8px; border: 1px solid #ddd; }
        .user { background: #eef2ff; }
        .bot { background: #f8fafc; }
        .time { font-size: 11px; color: #555; }
      </style>
      </head>
      <body>
      <h2>SentiBot Chat Export</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <hr/>
    `);

    messages.forEach((m) => {
      w!.document.write(`
        <div class="msg ${m.sender}">
          <strong>${m.sender === "user" ? "User" : "SentiBot"}</strong>
          <div class="time">${new Date(m.timestamp).toLocaleString()}</div>
          <pre>${m.text}</pre>
        </div>
      `);
    });

    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  // -----------------------------
  // Avatar Emoji
  // -----------------------------
  const lastBot = [...messages].reverse().find((m) => m.sender === "bot");

  const avatar = lastBot
    ? lastBot.sentiment?.startsWith("Positive")
      ? "😊"
      : lastBot.sentiment?.startsWith("Negative")
      ? "😞"
      : "😐"
    : "🤖";

  const avatarClass = lastBot
    ? lastBot.sentiment?.startsWith("Positive")
      ? "animate-bounce"
      : lastBot.sentiment?.startsWith("Negative")
      ? "animate-shake"
      : "animate-pulse"
    : "";

  // -----------------------------
  // CLEAR ALL HISTORY
  // -----------------------------
  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ===================================================================
  // UI STARTS HERE
  // ===================================================================
  return (
    <div className={`${darkMode ? "bg-black text-gray-100" : "bg-gradient-to-br from-purple-200 to-blue-200 text-gray-900"} min-h-screen flex`}>
      
      {/* =============================== */}
      {/* SIDEBAR (SUMMARY + TOOLS) */}
      {/* =============================== */}
      <aside className={`hidden md:flex flex-col w-80 ${darkMode ? "bg-[#0a0a0a]" : "bg-white"} shadow-2xl p-6 rounded-r-3xl gap-6`}>
        
        {/* Avatar + Title */}
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 flex items-center justify-center rounded-full shadow text-2xl ${avatarClass} ${darkMode ? "bg-[#111]" : "bg-gradient-to-br from-purple-600 to-blue-600 text-white"}`}>
            {avatar}
          </div>
          <div>
            <div className="text-lg font-bold">SentiBot</div>
            <div className="text-xs text-gray-400">Sentiment Analyzer</div>
          </div>
        </div>

        {/* ===== SUMMARY CARD ===== */}
        <div className={`rounded-xl p-4 border ${darkMode ? "bg-[#111] border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200"}`}>
          <h3 className="text-sm font-semibold mb-3">Summary</h3>

          {/* Pie + Bars */}
          <div className="flex gap-4 items-center">
            <PieChart pos={summary.pos} neg={summary.neg} neu={summary.neu} />
            <div className="flex-1 space-y-3">

              {/* Positive */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Positive</span>
                  <span>{summary.posPct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div style={{ width: `${summary.posPct}%` }} className="h-2 bg-gradient-to-r from-purple-600 to-blue-600"></div>
                </div>
              </div>

              {/* Negative */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Negative</span>
                  <span>{summary.negPct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div style={{ width: `${summary.negPct}%` }} className="h-2 bg-red-500"></div>
                </div>
              </div>

              {/* Neutral */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Neutral</span>
                  <span>{summary.neuPct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div style={{ width: `${summary.neuPct}%` }} className="h-2 bg-gray-400"></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ===== Buttons ===== */}
        <div className="space-y-2">
          <button
            onClick={() => setInputMessage("I feel great and happy!")}
            className="px-3 py-2 w-full rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm"
          >
            Example (Positive)
          </button>

          <button
            onClick={() => setInputMessage("I'm stressed and tired today.")}
            className="px-3 py-2 w-full rounded-md bg-red-600 text-white text-sm"
          >
            Example (Negative)
          </button>

          <button
            onClick={clearHistory}
            className={`px-3 py-2 w-full rounded-md ${darkMode ? "bg-[#111] text-gray-300 border border-gray-700" : "bg-white border text-gray-700"} text-sm`}
          >
            Clear History
          </button>

          <button
            onClick={exportPDF}
            className="px-3 py-2 w-full rounded-md bg-gray-800 text-white text-sm"
          >
            Export PDF
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode((v) => !v)}
          className={`px-3 py-2 w-full rounded-md text-sm ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100"}`}
        >
          {darkMode ? "Light Mode ☀️" : "Dark Mode 🌙"}
        </button>

      </aside>

      {/* =============================== */}
      {/* MAIN CHAT PANEL */}
      {/* =============================== */}
      <main className="flex-1 flex flex-col h-full">

        {/* HEADER */}
        <header className={`${darkMode ? "bg-[#0f0f0f] text-gray-200" : "bg-white"} border-b px-6 py-4 shadow-sm`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600"}`}>
                SentiBot – Sentiment Analysis
              </h1>
              <p className={`${darkMode ? "text-gray-400" : "text-purple-600"} text-sm`}>
                Analyze emotions, confidence and receive helpful advice.
              </p>
            </div>

            {/* Avatar + Mic + PDF */}
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl shadow ${avatarClass} ${darkMode ? "bg-[#111]" : "bg-white"}`}>
                {avatar}
              </div>

              <button
                onClick={handleMic}
                className={`px-3 py-2 rounded-md text-sm ${listening ? "bg-red-600 text-white" : darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100"}`}
              >
                {listening ? "Stop Mic" : "Voice Input"}
              </button>

              <button
                onClick={exportPDF}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md text-sm"
              >
                PDF
              </button>
            </div>
          </div>
        </header>

        {/* =============================== */}
        {/* CHAT MESSAGES */}
        {/* =============================== */}
        <section className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-semibold text-purple-400">Welcome to SentiBot</h2>
              <p className="text-gray-400 mt-2">Type a message below to begin.</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex w-full ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl shadow whitespace-pre-line
                ${
                  m.sender === "user"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : darkMode
                    ? "bg-[#111] border border-gray-800 text-gray-200"
                    : "bg-white border border-gray-200"
                }`}
              >
                <p>{m.text}</p>

                <div className="flex justify-between mt-2 text-xs opacity-70">
                  <span>{formatTime(m.timestamp)}</span>
                  {m.sender === "bot" && (
                    <span>{m.sentiment}</span>
                  )}
                </div>

                {m.sender === "bot" && (
                  <div className="mt-3">
                    
                    {/* Confidence Bar */}
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${m.confidence}%` }}
                        className={`h-2 ${
                          m.confidence! >= 70
                            ? "bg-green-500"
                            : m.confidence! >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Confidence: {m.confidence}%</p>

                    {/* Advice Box */}
                    {m.advice && (
                      <div
                        className={`p-3 rounded-md mt-3 text-sm border
                        ${
                          darkMode
                            ? "bg-black border-gray-700 text-gray-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <strong>Advice: </strong> {m.advice}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="text-purple-400">Analyzing…</div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* =============================== */}
        {/* INPUT FOOTER */}
        {/* =============================== */}
        <footer className={`${darkMode ? "bg-black border-gray-800" : "bg-white"} border-t px-4 py-4`}>
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto items-center">
            
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type something to analyze sentiment..."
              className={`flex-1 px-4 py-3 rounded-full border shadow-sm outline-none
              ${
                darkMode
                  ? "bg-[#111] border-gray-700 text-gray-200 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
              }`}
            />

            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
            >
              Send
            </button>

            <button
              type="button"
              onClick={() => {
                const text = `SentiBot Summary\nTotal: ${summary.total}\nPositive: ${summary.pos}\nNegative: ${summary.neg}\nNeutral: ${summary.neu}\n`;
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "senti_summary.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`px-4 py-3 rounded-full ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}
            >
              Summary
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              className={`px-4 py-3 rounded-full ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100"}`}
            >
              {darkMode ? "Light" : "Dark"}
            </button>

            <button
              type="button"
              onClick={handleMic}
              className={`px-4 py-3 rounded-full ${listening ? "bg-red-600 text-white" : darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100"}`}
            >
              {listening ? "Stop" : "Mic"}
            </button>

          </form>
        </footer>
      </main>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.7s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
