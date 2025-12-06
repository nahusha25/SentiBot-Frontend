import React, { useState } from "react";

const ChatPage: React.FC = () => {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const name = user?.name || "Friend";

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `${name}, 💬 How are you feeling today?`,
    },
  ]);

  const [input, setInput] = useState("");

  // -------------------------------------------------------
  // EMOTIONAL AI ENGINE — SAD + HAPPY + DEFAULT RESPONSE
  // -------------------------------------------------------
  function generateEmotionalResponse(message: string) {
    const msg = message.toLowerCase();

    const sadWords = [
      "sad", "depressed", "lonely", "stress", "upset", "crying",
      "hurt", "bad", "unhappy", "worried", "anxious"
    ];

    const happyWords = [
      "happy", "good", "great", "awesome",
      "excited", "joy", "fantastic", "nice"
    ];

    // SAD RESPONSE (ONE SINGLE MESSAGE WITH HTML)
    if (sadWords.some((w) => msg.includes(w))) {
      return `
      ${name}, I'm really sorry you're feeling this way 💙  
      You're not alone — I'm here for you. <br><br>

      ✨ <b>Motivational Quote</b>: “Every storm runs out of rain.” — Maya Angelou <br><br>

      📍 <b>Nearby Psychiatrists (Bangalore):</b><br>
      1. NIMHANS Hospital — <a href="tel:08026995000">080-26995000</a><br>
      2. Cadabams Hospital — <a href="tel:+919741476476">+91 97414 76476</a><br><br>

      🔗 <b>Find Psychiatrists Near You (Google Maps):</b><br>
      <a href="https://www.google.com/maps/search/psychiatrist+near+me/" 
         target="_blank" 
         style="color:#4f46e5; text-decoration: underline;">
         Click here to open Google Maps
      </a><br><br>

      ☎ <b>24/7 Mental Health Helpline (India):</b> 
      <a href="tel:18005990019">1800-599-0019</a><br><br>

      Would you like to talk about what made you feel this way?
      `;
    }

    // HAPPY RESPONSE
    if (happyWords.some((w) => msg.includes(w))) {
      return `
      That's amazing, ${name}! 😄<br>
      I'm really happy for you!<br><br>

      🎉 Keep spreading positivity — the world needs more of it!<br><br>

      ✨ <b>Motivational Boost</b>: “Success is the sum of small efforts repeated daily.”<br><br>

      Tell me, what made your day so good?
      `;
    }

    // DEFAULT / UNKNOWN EMOTION RESPONSE
    return `
      I hear you, ${name}. Tell me more! <br>
      I'm here to listen and support you 😊
    `;
  }

  // -------------------------------------------------------
  // SEND MESSAGE
  // -------------------------------------------------------
  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    // Show user's message
    setMessages((prev) => [...prev, { sender: "you", text }]);

    // Bot reply
    const reply = generateEmotionalResponse(text);

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 700);

    setInput("");
  };

  // SAMPLE BUTTONS
  const sampleSad = () => sendMessage("I am feeling sad and lonely.");
  const sampleHappy = () => sendMessage("I am feeling very happy today!");

  return (
    <div className="flex h-screen">
      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-gray-100 p-5 border-r">
        <h2 className="text-xl font-bold mb-5">Mood summary</h2>

        <p><strong>User:</strong> {user?.name}</p>
        <p><strong>City:</strong> {user?.city || "Not Provided"}</p>

        <div className="mt-5 space-y-3">
          <button onClick={sampleSad} className="w-full py-2 bg-red-200 rounded">
            🥺 Sample Sad
          </button>

          <button onClick={sampleHappy} className="w-full py-2 bg-green-200 rounded">
            😊 Sample Happy
          </button>

          <button
            onClick={() => setMessages([])}
            className="w-full py-2 bg-red-300 rounded"
          >
            🗑 Clear Chat
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full py-2 bg-black text-white rounded"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">
        <div className="p-5 flex-1 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`my-2 p-3 rounded-lg w-fit max-w-xl ${
                msg.sender === "you"
                  ? "ml-auto bg-purple-400 text-white"
                  : "bg-gray-200"
              }`}
            >
              {/* RENDER HTML SAFELY */}
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          ))}
        </div>

        {/* INPUT BOX */}
        <div className="p-4 border-t flex">
          <input
            className="flex-1 border px-4 py-2 rounded-l-full"
            placeholder="Type how you're feeling..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={() => sendMessage(input)}
            className="bg-purple-500 text-white px-6 rounded-r-full"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
