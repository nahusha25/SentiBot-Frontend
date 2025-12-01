import React, { useState, useEffect, useRef } from "react";

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([
    {
      sender: "bot",
      text: "Hello! I'm SentiBot 😊 How can I support you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    // Add user bubble
    setMessages((prev) => [...prev, { sender: "user", text }]);

    try {
      const res = await fetch("http://localhost:3000/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, user }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply || "I'm here to help!" },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Unable to reach server. Please try again.",
        },
      ]);
    }
  };

  const handleKey = (e: any) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="h-screen flex flex-col bg-[#F4EEFF]">

      {/* Header */}
      <header className="w-full bg-white shadow-md py-4 px-6 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold text-purple-700">SentiBot Chat</h1>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex w-full ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xl px-4 py-3 rounded-2xl shadow-md text-base leading-relaxed ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 border rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
          <input
            value={input}
            onKeyDown={handleKey}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
          />

          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
