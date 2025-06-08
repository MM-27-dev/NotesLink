import React, { useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import Header from "./Header";
import chatData from "../data/chatData";
import { getGeminiResponse } from "../utils/geminiService";
import { cleanText } from "../utils/cleanText";

const ChatUI = () => {
  const [messages, setMessages] = useState(chatData);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for the end of the messages div

  // Effect to scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = {
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Get response from Gemini
    const response = await getGeminiResponse(input);
    const plainText = cleanText(response); // Use the updated cleanText

    const assistantMessage = {
      sender: "assistant",
      // Set the text as dangerouslySetInnerHTML to render HTML
      text: <div dangerouslySetInnerHTML={{ __html: plainText }} />,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-950 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl h-[500px] bg-[#0f0f1b] rounded-2xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-purple-800">
            <h2 className="text-pink-400 font-semibold text-lg">
              AI Voice Assistant
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-white custom-scrollbar">
            {" "}
            {/* Added custom-scrollbar class */}
            {messages.map((msg, index) =>
              msg.sender === "user" ? (
                <div key={index} className="flex justify-end">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-xl px-4 py-2 shadow-md">
                    <p>{msg.text}</p>
                    <span className="text-xs text-gray-300 block text-right mt-1">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  key={index}
                  className="max-w-[75%] bg-[#1e1e2e] rounded-lg p-3"
                >
                  {/* Render the HTML content using dangerouslySetInnerHTML */}
                  {msg.text}
                  <span className="text-xs text-gray-400 block text-right mt-1">
                    {msg.time}
                  </span>
                </div>
              )
            )}
            {loading && (
              <div className="max-w-[75%] bg-[#1e1e2e] rounded-lg p-3 flex items-center">
                <span className="dot-animation mr-2">.</span>
                <span className="dot-animation mr-2 animation-delay-1">.</span>
                <span className="dot-animation animation-delay-2">.</span>
              </div>
            )}
            <div ref={messagesEndRef} /> {/* Element to scroll into view */}
          </div>

          <div className="p-4 border-t border-purple-800 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 rounded-full px-4 py-2 bg-gray-800 text-white placeholder-gray-400 outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button className="text-pink-400">
              <Mic />
            </button>
            <button onClick={handleSend} className="text-pink-400">
              <Send />
            </button>
          </div>
        </div>
      </div>
      {/* Add a style block for the dot animation and scrollbar hiding */}
      <style jsx>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 0.2;
          }
          33% {
            opacity: 1;
          }
          66% {
            opacity: 0.2;
          }
        }
        .dot-animation {
          animation: blink 1.4s infinite;
        }
        .dot-animation.animation-delay-1 {
          animation-delay: 0.2s;
        }
        .dot-animation.animation-delay-2 {
          animation-delay: 0.4s;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .custom-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
};


export default ChatUI;
