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

const STORAGE_KEY = "sentibot_messages_v_full";
const THEME_KEY = "sentibot_theme_v_full";

const ChatPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw !== null) return JSON.parse(raw);
    // default to system preference
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // load saved messages
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setMessages(JSON.parse(raw)); } catch { localStorage.removeItem(STORAGE_KEY); }
    }
  }, []);

  // save messages & scroll
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // save theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(darkMode));
  }, [darkMode]);

  // voice recognition setup
  useEffect(() => {
    const win: any = window;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInputMessage(prev => (prev ? prev + " " + text : text));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const handleMic = () => {
    if (!recognitionRef.current) return alert("Voice recognition not supported in this browser.");
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { recognitionRef.current.start(); setListening(true); }
  };

  // small reusable helper to format time
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Pie chart simple svg component
  const PieChart: React.FC<{ pos: number; neg: number; neu: number; size?: number }> = ({ pos, neg, neu, size = 100 }) => {
    const total = pos + neg + neu || 1;
    const slices = [
      { value: pos / total, color: "#8b5cf6" }, // purple
      { value: neg / total, color: "#ef4444" }, // red
      { value: neu / total, color: "#9ca3af" }, // gray
    ];
    const radius = size / 2;
    const center = size / 2;
    let cumulative = 0;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => {
          const start = cumulative;
          cumulative += s.value;
          const end = cumulative;
          const largeArc = s.value > 0.5 ? 1 : 0;
          const startAngle = start * 2 * Math.PI - Math.PI / 2;
          const endAngle = end * 2 * Math.PI - Math.PI / 2;
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return <path key={i} d={d} fill={s.color} stroke={darkMode ? "#0b0b0b" : "white"} strokeWidth={0.6} />;
        })}
        <circle cx={center} cy={center} r={radius * 0.55} fill={darkMode ? "#0b0b0b" : "white"} />
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill={darkMode ? "#e5e7eb" : "#111"}>
          {pos + neg + neu}
        </text>
      </svg>
    );
  };

  // summary counts (pos/neg/neu)
  const summary = (() => {
    let pos = 0, neg = 0, neu = 0;
    for (const m of messages) {
      if (m.sender === "bot" && m.sentiment) {
        const s = m.sentiment.toLowerCase();
        if (s.includes("positive")) pos++;
        else if (s.includes("negative")) neg++;
        else neu++;
      }
    }
    const total = pos + neg + neu;
    return {
      pos, neg, neu, total,
      posPct: total ? Math.round((pos / total) * 100) : 0,
      negPct: total ? Math.round((neg / total) * 100) : 0,
      neuPct: total ? Math.round((neu / total) * 100) : 0,
    };
  })();

  // export full chat to PDF (simple print window)
  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow popups.");
    w.document.write(`<html><head><title>SentiBot Export</title>
      <style>body{font-family:Arial;padding:20px} .msg{margin-bottom:12px;padding:10px;border-radius:8px;border:1px solid #ddd}</style>
      </head><body><h2>SentiBot Chat Export</h2><small>Generated: ${new Date().toLocaleString()}</small><hr/>`);
    messages.forEach(m => {
      w!.document.write(`<div class="msg"><strong>${m.sender === "user" ? "You" : "SentiBot"}</strong> <div style="font-size:12px;color:#666">${new Date(m.timestamp).toLocaleString()}</div><pre style="white-space:pre-wrap">${m.text}</pre>${m.advice ? `<div><strong>Advice:</strong> ${m.advice}</div>` : ""}</div>`);
    });
    w!.document.write("</body></html>");
    w!.document.close();
    w!.print();
  };

  // helper avatar by sentiment
  const getEmojiFor = (sentiment?: string) => {
    if (!sentiment) return "🤖";
    const s = sentiment.toLowerCase();
    if (s.includes("positive")) return "😊";
    if (s.includes("negative")) return "😞";
    return "😐";
  };

  // -------------------------
  // SEND MESSAGE (calls backend)
  // backend path expects POST /sentiment { message: "..." }
  // -------------------------
  const sendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), text, sender: "user", timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("https://https://sentibot-backend-tezj.onrender.com/sentiment", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error("Bad response from backend");
      const data = await res.json();
      // data should include: mood/mood, advice, score/comparative
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sentiment: ${data.mood || data.mood}\n\nAdvice: ${data.advice || data.advice || ""}`,
        sender: "bot",
        timestamp: new Date().toISOString(),
        sentiment: data.mood || data.mood,
        confidence: data.score !== undefined ? Math.round(Math.min(100, Math.abs(data.score) * 20 + 50)) : (data.confidence || 80),
        advice: data.advice || "",
      };
      setTimeout(() => { // small delay for typing feel
        setMessages(prev => [...prev, botMsg]);
      }, 450);
    } catch (err) {
      console.error(err);
      alert("Backend not reachable at http://localhost:3000/sentiment — start the backend or change URL.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage.trim());
  };

  // quick examples
  const examplePositive = () => setInputMessage("I feel happy and excited about my day!");
  const exampleNegative = () => setInputMessage("I'm very stressed and sad today.");

  // clear
  const clearHistory = () => { setMessages([]); localStorage.removeItem(STORAGE_KEY); };

  // last bot emoji for header
  const lastBot = [...messages].reverse().find(m => m.sender === "bot");
  const headerEmoji = lastBot ? getEmojiFor(lastBot.sentiment) : "🤖";

  return (
    <div className={`${darkMode ? "bg-gray-900 text-gray-100" : "bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900"} min-h-screen flex`}>
      {/* SIDEBAR */}
      <aside className={`${darkMode ? "bg-gray-800" : "bg-white"} w-80 p-6 hidden md:flex flex-col gap-6 shadow-xl`}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            {headerEmoji}
          </div>
          <div>
            <div className="text-lg font-bold">SentiBot</div>
            <div className="text-sm opacity-70">Sentiment Analyzer</div>
          </div>
        </div>

        <div className={`${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-200"} p-4 rounded-xl border`}>
          <h3 className="text-sm font-semibold mb-2">Summary</h3>
          <div className="flex items-center gap-4">
            <PieChart pos={summary.pos} neg={summary.neg} neu={summary.neu} />
            <div>
              <div>Total: <strong>{summary.total}</strong></div>
              <div className="text-sm text-green-600">Positive: {summary.pos} ({summary.posPct}%)</div>
              <div className="text-sm text-red-600">Negative: {summary.neg} ({summary.negPct}%)</div>
              <div className="text-sm text-gray-500">Neutral: {summary.neu} ({summary.neuPct}%)</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={examplePositive} className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white">Example Positive</button>
          <button onClick={exampleNegative} className="w-full px-3 py-2 rounded-md bg-red-600 text-white">Example Negative</button>
          <button onClick={clearHistory} className={`${darkMode ? "bg-gray-700 text-gray-200" : "bg-white border"} w-full px-3 py-2 rounded-md`}>Clear History</button>
          <button onClick={() => setDarkMode(v => !v)} className="w-full px-3 py-2 rounded-md bg-gray-800 text-white">{darkMode ? "Light Mode" : "Dark Mode"}</button>
          <button onClick={exportPDF} className="w-full px-3 py-2 rounded-md bg-gray-600 text-white">Export Chat (PDF/Print)</button>
        </div>

        <div className="text-xs opacity-60 mt-auto">Local demo • No auth required</div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        <header className={`${darkMode ? "bg-gray-900 text-gray-100" : "bg-white"} px-6 py-4 border-b`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">SentiBot — Sentiment Analysis</h1>
              <p className="text-sm opacity-70">Type anything and get sentiment, confidence and advice.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{headerEmoji}</div>
              <button onClick={() => window.open("https://github.com", "_blank")} className="px-3 py-1 rounded bg-purple-600 text-white">Share</button>
            </div>
          </div>
        </header>

        {/* MESSAGES */}
        <section className="flex-1 overflow-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-semibold">Welcome to SentiBot</h2>
              <p className="text-gray-500 mt-2">Try the example buttons or type your message below.</p>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-md whitespace-pre-line ${m.sender === "user" ? "bg-purple-600 text-white" : (darkMode ? "bg-gray-800 text-gray-100 border border-gray-700" : "bg-white border")}`}>
                <div className="flex items-start gap-3">
                  {m.sender === "bot" && <div className="text-2xl mr-2">{getEmojiFor(m.sentiment)}</div>}
                  <div className="flex-1">
                    <div>{m.text}</div>
                    {m.sender === "bot" && m.advice && <div className="mt-3 p-2 rounded bg-opacity-10 text-sm">{m.advice}</div>}
                    <div className="flex justify-between text-xs opacity-60 mt-2">
                      <span>{formatTime(m.timestamp)}</span>
                      {m.sender === "bot" && <span>Confidence: {m.confidence ?? "-" }%</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="text-gray-400">SentiBot is analyzing<span className="animate-pulse"> . . .</span></div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* INPUT */}
        <footer className={`${darkMode ? "bg-gray-900" : "bg-white"} border-t px-6 py-4`}>
          <form onSubmit={handleSubmit} className="flex gap-3 items-center max-w-4xl mx-auto">
            <input
              className={`flex-1 rounded-full px-4 py-3 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`}
              placeholder="Type message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" disabled={!inputMessage.trim() || isLoading} className="px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow">
              {isLoading ? "Analyzing..." : "Send"}
            </button>
            <button type="button" onClick={handleMic} className={`px-4 py-3 rounded-full ${listening ? "bg-red-600 text-white" : "bg-gray-700 text-white"}`}>
              {listening ? "Stop" : "Mic"}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
};

export default ChatPage;
