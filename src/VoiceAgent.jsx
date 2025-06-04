// import React, { useState, useEffect, useRef } from "react";

// const Timer = ({ minutes, seconds }) => (
//   <div className="text-[40px] md:text-[72px] font-light tracking-wider text-chat-text-secondary">
//     {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
//   </div>
// );

// const VoiceAgent = ({ onCallEnd }) => {
//   const [minutes, setMinutes] = useState(0);
//   const [seconds, setSeconds] = useState(0);
//   const [isTimerActive, setIsTimerActive] = useState(false);
//   const [listening, setListening] = useState(false);
//   const [isAiSpeaking, setIsAiSpeaking] = useState(false);
//   const [callActive, setCallActive] = useState(false);
//   const audioRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const dataChannelRef = useRef(null);
//   const streamRef = useRef(null);
//   const localAudioCtxRef = useRef(null);
//   const remoteAudioCtxRef = useRef(null);
//   const micSourceRef = useRef(null);
//   const aiSourceRef = useRef(null);
//   const intervalRef = useRef(null);

//   const backendUrl = "http://localhost:9000";
  

//   // Timer increment logic
//   useEffect(() => {
//     if (!isTimerActive) return;
//     intervalRef.current = setInterval(() => {
//       setSeconds((prev) => {
//         if (prev === 59) {
//           setMinutes((m) => m + 1);
//           return 0;
//         }
//         return prev + 1;
//       });
//     }, 1000);

//     return () => clearInterval(intervalRef.current);
//   }, [isTimerActive]);

//   // Clean up everything on unmount
//   useEffect(() => {
//     return () => {
//       endCall(false);
//     };
//   }, []);

//   // Start the voice call
//   const startCall = async (prompt = "Hello from Voice Agent!") => {
//     if (!backendUrl ) {
//       alert("Missing backend URL or access token!");
//       return;
//     }
//     if (callActive) {
//       console.warn("Call already active");
//       return;
//     }

//     try {
//       // Get realtime session token from backend
//       const res =  await fetch("http://localhost:9000/session");
//       const data = await res.json();
//       console.log(data);

//       const pc = new RTCPeerConnection();
//       peerConnectionRef.current = pc;

//       // Setup ontrack for incoming audio
//       pc.ontrack = (event) => {
//         const remoteStream = event.streams[0];
//         if (audioRef.current) {
//           audioRef.current.srcObject = remoteStream;
//           audioRef.current.play().catch(console.error);
//         }

//         remoteAudioCtxRef.current = new AudioContext();
//         aiSourceRef.current =
//           remoteAudioCtxRef.current.createMediaStreamSource(remoteStream);
//         const analyser = remoteAudioCtxRef.current.createAnalyser();
//         analyser.fftSize = 512;
//         aiSourceRef.current.connect(analyser);

//         const dataArray = new Uint8Array(analyser.frequencyBinCount);
//         const checkAiSpeaking = () => {
//           analyser.getByteFrequencyData(dataArray);
//           const volume =
//             dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
//           setIsAiSpeaking(volume > 10);
//         };

//         const speakingInterval = setInterval(checkAiSpeaking, 300);

//         remoteStream.getTracks().forEach((track) => {
//           track.addEventListener("ended", () => {
//             clearInterval(speakingInterval);
//             setIsAiSpeaking(false);
//             remoteAudioCtxRef.current?.close();
//           });
//         });
//       };

//       // Get local mic stream & add to peer connection
//       streamRef.current = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//       });
//       streamRef.current
//         .getTracks()
//         .forEach((track) => pc.addTrack(track, streamRef.current));

//       localAudioCtxRef.current = new AudioContext();
//       micSourceRef.current = localAudioCtxRef.current.createMediaStreamSource(
//         streamRef.current
//       );
//       const localAnalyser = localAudioCtxRef.current.createAnalyser();
//       localAnalyser.fftSize = 512;
//       micSourceRef.current.connect(localAnalyser);

//       const localDataArray = new Uint8Array(localAnalyser.frequencyBinCount);
//       const checkUserSpeaking = () => {
//         localAnalyser.getByteFrequencyData(localDataArray);
//         const volume =
//           localDataArray.reduce((a, b) => a + b, 0) / localDataArray.length;
//         setListening(volume > 10);
//       };

//       const userSpeakingInterval = setInterval(checkUserSpeaking, 300);

//       streamRef.current.getTracks().forEach((track) => {
//         track.addEventListener("ended", () => {
//           clearInterval(userSpeakingInterval);
//           setListening(false);
//           localAudioCtxRef.current?.close();
//         });
//       });

//       // Create data channel for session events
//       const dc = pc.createDataChannel("oai-events");
//       dataChannelRef.current = dc;

//       dc.addEventListener("open", () => {
//         dc.send(
//           JSON.stringify({
//             type: "session.update",
//             session: {
//               instructions:
//                 "\n\nIMPORTANT: Speak in a warm, clear, and VERY strong Indian accent only, suitable for Indian audiences.\n" +
//                 prompt,
//               input_audio_transcription: { model: "whisper-1" },
//             },
//           })
//         );
//         setIsTimerActive(true);
//         setCallActive(true);
//       });

//       dc.addEventListener("close", () => {
//         setCallActive(false);
//         setIsTimerActive(false);
//       });

     
//     } catch (error) {
//       console.error("Failed to start call", error);
//     }
//   };

//   // End the voice call and clean up resources
//   const endCall = async (redirectToChat = true) => {
//     setCallActive(false);
//     setIsTimerActive(false);
//     setListening(false);
//     setIsAiSpeaking(false);
//     setMinutes(0);
//     setSeconds(0);

//     if (peerConnectionRef.current) {
//       peerConnectionRef.current.close();
//       peerConnectionRef.current = null;
//     }
//     if (
//       dataChannelRef.current &&
//       dataChannelRef.current.readyState === "open"
//     ) {
//       dataChannelRef.current.close();
//       dataChannelRef.current = null;
//     }
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//     audioRef.current?.pause();
//     audioRef.current.srcObject = null;

//     try {
//       await localAudioCtxRef.current?.close();
//       await remoteAudioCtxRef.current?.close();
//     } catch (e) {
//       console.warn("AudioContext close error", e);
//     }
//     localAudioCtxRef.current = null;
//     remoteAudioCtxRef.current = null;

//     clearInterval(intervalRef.current);

//     if (onCallEnd && redirectToChat) {
//       onCallEnd();
//     }
//   };

//   return (
//     <div className="voice-agent-container p-4 bg-gray-900 text-white rounded-lg flex flex-col items-center space-y-6">
//       <Timer minutes={minutes} seconds={seconds} />
//       <audio ref={audioRef} autoPlay />
//       <div className="flex space-x-4">
//         {!callActive ? (
//           <button
//             onClick={() =>
//               startCall("Welcome to the AI voice agent. Please speak clearly.")
//             }
//             className="px-6 py-2 bg-green-600 rounded hover:bg-green-700"
//           >
//             Start Call
//           </button>
//         ) : (
//           <button
//             onClick={() => endCall()}
//             className="px-6 py-2 bg-red-600 rounded hover:bg-red-700"
//           >
//             End Call
//           </button>
//         )}
//       </div>
//       <div className="flex space-x-6 text-lg">
//         <div>
//           Listening:{" "}
//           <span
//             className={listening ? "text-green-400 font-bold" : "text-gray-500"}
//           >
//             {listening ? "🎤" : "🔇"}
//           </span>
//         </div>
//         <div>
//           AI Speaking:{" "}
//           <span
//             className={
//               isAiSpeaking ? "text-green-400 font-bold" : "text-gray-500"
//             }
//           >
//             {isAiSpeaking ? "🗣️" : "🤖"}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VoiceAgent;


// src/components/VoiceAgent.jsx
import React, { useState, useEffect, useRef } from "react";

const Timer = ({ minutes, seconds }) => (
  <div className="text-[40px] md:text-[72px] font-light tracking-wider text-chat-text-secondary">
    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
  </div>
);

const VoiceAgent = ({ onCallEnd }) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [callActive, setCallActive] = useState(false);

  const audioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const streamRef = useRef(null);
  const localAudioCtxRef = useRef(null);
  const remoteAudioCtxRef = useRef(null);
  const micSourceRef = useRef(null);
  const aiSourceRef = useRef(null);
  const intervalRef = useRef(null);

  const backendUrl = "http://localhost:9000";

  useEffect(() => {
    if (!isTimerActive) return;
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 59) {
          setMinutes((m) => m + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isTimerActive]);

  useEffect(() => {
    return () => {
      endCall(false);
    };
  }, []);

  const startCall = async (prompt = "Hello from Voice Agent!") => {
    if (!backendUrl) {
      alert("Missing backend URL!");
      return;
    }
    if (callActive) {
      console.warn("Call already active");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/session`);
      const data = await res.json();
      console.log(data);
      

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
          audioRef.current.play().catch(console.error);
        }

        remoteAudioCtxRef.current = new AudioContext();
        aiSourceRef.current = remoteAudioCtxRef.current.createMediaStreamSource(remoteStream);
        const analyser = remoteAudioCtxRef.current.createAnalyser();
        analyser.fftSize = 512;
        aiSourceRef.current.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAiSpeaking = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setIsAiSpeaking(volume > 10);
        };

        const speakingInterval = setInterval(checkAiSpeaking, 300);

        remoteStream.getTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            clearInterval(speakingInterval);
            setIsAiSpeaking(false);
            remoteAudioCtxRef.current?.close();
          });
        });
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));

      localAudioCtxRef.current = new AudioContext();
      micSourceRef.current = localAudioCtxRef.current.createMediaStreamSource(streamRef.current);
      const localAnalyser = localAudioCtxRef.current.createAnalyser();
      localAnalyser.fftSize = 512;
      micSourceRef.current.connect(localAnalyser);

      const localDataArray = new Uint8Array(localAnalyser.frequencyBinCount);
      const checkUserSpeaking = () => {
        localAnalyser.getByteFrequencyData(localDataArray);
        const volume = localDataArray.reduce((a, b) => a + b, 0) / localDataArray.length;
        setListening(volume > 10);
      };

      const userSpeakingInterval = setInterval(checkUserSpeaking, 300);

      streamRef.current.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          clearInterval(userSpeakingInterval);
          setListening(false);
          localAudioCtxRef.current?.close();
        });
      });

      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.addEventListener("open", () => {
        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions:
                "\n\nIMPORTANT: Speak in a warm, clear, and VERY strong Indian accent only, suitable for Indian audiences.\n" +
                prompt,
              input_audio_transcription: { model: "whisper-1" },
            },
          })
        );
        setIsTimerActive(true);
        setCallActive(true);
      });

      dc.addEventListener("close", () => {
        setCallActive(false);
        setIsTimerActive(false);
      });

      // Signal exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sigRes = await fetch(`${backendUrl}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer }),
      });

      const { answer } = await sigRes.json();
      await pc.setRemoteDescription(answer);
    } catch (error) {
      console.error("Failed to start call", error);
    }
  };

  const endCall = async (redirectToChat = true) => {
    setCallActive(false);
    setIsTimerActive(false);
    setListening(false);
    setIsAiSpeaking(false);
    setMinutes(0);
    setSeconds(0);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    audioRef.current?.pause();
    audioRef.current.srcObject = null;

    try {
      await localAudioCtxRef.current?.close();
      await remoteAudioCtxRef.current?.close();
    } catch (e) {
      console.warn("AudioContext close error", e);
    }

    localAudioCtxRef.current = null;
    remoteAudioCtxRef.current = null;
    clearInterval(intervalRef.current);

    if (onCallEnd && redirectToChat) onCallEnd();
  };

  return (
    <div className="voice-agent-container p-4 bg-gray-900 text-white rounded-lg flex flex-col items-center space-y-6">
      <Timer minutes={minutes} seconds={seconds} />
      <audio ref={audioRef} autoPlay />
      <div className="flex space-x-4">
        {!callActive ? (
          <button
            onClick={() => startCall("Welcome to the AI voice agent. Please speak clearly.")}
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Start Call
          </button>
        ) : (
          <button
            onClick={() => endCall()}
            className="px-6 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            End Call
          </button>
        )}
      </div>
      <div className="flex space-x-6 text-lg">
        <div>
          Listening:{" "}
          <span className={listening ? "text-green-400 font-bold" : "text-gray-500"}>
            {listening ? "🎤" : "🔇"}
          </span>
        </div>
        <div>
          AI Speaking:{" "}
          <span className={isAiSpeaking ? "text-green-400 font-bold" : "text-gray-500"}>
            {isAiSpeaking ? "🗣️" : "🤖"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;
