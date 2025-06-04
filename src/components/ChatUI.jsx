import React, { useState } from "react";
import { Mic, Send } from "lucide-react";
import Header from "./Header";
import chatData from "../data/chatData";

const ChatUI = () => {
  const [messages, setMessages] = useState(chatData);

  const [input, setInput] = useState("");

  const handleSend = () => {
   
      if (input.trim() === "") return;

      const newMessage = {
        sender: "user",
        text: input,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages([...messages, newMessage]);
      setInput("");
    
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-950 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl h-[400px] bg-[#0f0f1b] rounded-2xl shadow-lg flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-purple-800">
            <h2 className="text-pink-400 font-semibold text-lg">
              AI Voice Assistant
            </h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-white">
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
                  <p>{msg.text}</p>
                  <span className="text-xs text-gray-400 block text-right mt-1">
                    {msg.time}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Message Input */}
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
    </div>
  );
};

export default ChatUI;
