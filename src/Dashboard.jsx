/* eslint-disable no-unused-vars */
import { useState } from "react";
// import ChatLayout from "./ChatLayout";
import AudioCall from "./AudioCall";
// import Navbar from "./NavBarChat";
import { useParams } from "react-router-dom";
import { API } from "../lib/api";
import { useChatSession } from "../context/chatSessionContext";

const Dashboard = ({ chatBotType }) => {
  const [showHistory, setShowHistory] = useState(false);
  const { learnBotInput } = useParams();
  const [chatMode, setChatMode] = useState(true);
  const learnBotMessage = learnBotInput ?? "";
  const [loadingCall, setLoadingCall] = useState(true);
  const { setCurrentSessionId } = useChatSession();

  const handleStartCall = async (sessionId) => {
    try {
      setLoadingCall(true);
      const user = JSON.parse(localStorage.getItem("user") || "null");

      // setting prompt for voice call
    //   const prompt = await API.fetchCurrentPrompt(user?.firstName, chatBotType);
      const prompt = await API.fetchCurrentPrompt(user?.firstName, chatBotType);
      localStorage.setItem("start-call-prompt", prompt);
    //   localStorage.setItem("start-call-prompt", prompt);

// 
      // if session does not exist, then create a session
      if (!sessionId || sessionId === "undefined") {
        const response = await API.createSession(user?.firstName, chatBotType);
        setCurrentSessionId(response._id);
      }

      setChatMode(false);
    } catch (err) {
      console.error("Failed to start call.", err);
      setChatMode(true);
    } finally {
      setLoadingCall(false);
    }
  };

  return (
    <div className="relative h-screen bg-chat-dark text-chat-text">
      {/* {chatMode && (
        <div className="fixed top-0 left-0 right-0 z-20">
          <Navbar
            setShowHistory={setShowHistory}
            chatBot={chatBotType}
            setChatMode={setChatMode}
            onStartCall={handleStartCall}
          />
        </div>
      )} */}
      <AudioCall chatBot={chatBotType} setChatMode={setChatMode} />
      {/* {chatMode ? (
        <div className="pt-20 h-full overflow-hidden">
          <ChatLayout
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            chatBotType={chatBotType}
            learnBotMessage={learnBotMessage}
          />
        </div>
      ) : loadingCall ? (
        <div className="min-h-screen flex items-center justify-center text-xl">
          🔄 Connecting to AI Teacher...
        </div>
      ) : (
        
      )} */}
    </div>
  );
};

export default Dashboard;
