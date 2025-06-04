/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { PhoneOff, Target } from "lucide-react";
import { useChatSession } from "../context/chatSessionContext";
import { useChatMessages } from "../context/chatMessagesContext";
import { API } from "../lib/api";

const Timer = ({ minutes, seconds }) => {
  return (
    <div className="text-[40px] md:text-[72px] font-light tracking-wider text-chat-text-secondary">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

const AudioCall = ({ setChatMode }) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const dataChannelRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const aiTranscriptRef = useRef("");

  const micSourceRef = useRef(null);
  const aiSourceRef = useRef(null);

  const { currentSessionId } = useChatSession();
  const { messages, setMessages } = useChatMessages();
  const initialMessageCountRef = useRef(0);

  const streamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const audioRef = useRef(null);
  const localAudioCtxRef = useRef(null);
  const remoteAudioCtxRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const accessToken = localStorage.getItem("accessToken");

  if (!backendUrl || !accessToken) {
    throw new Error("Missing environment variables or access token.");
  }

  const endCall = async (redirectToChat = true) => {
    if (peerConnectionRef.current) {
      try {
        const pc = peerConnectionRef.current;
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.oniceconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.onicegatheringstatechange = null;
        pc.onconnectionstatechange = null;

        pc.getSenders().forEach((sender) => sender.track?.stop());
        pc.getReceivers().forEach((receiver) => receiver.track?.stop());

        pc.close();
        peerConnectionRef.current = null;
      } catch (err) {
        console.error("Error closing peer connection:", err);
      }
    }

    if (dataChannelRef.current) {
      try {
        if (dataChannelRef.current.readyState === "open") {
          dataChannelRef.current.close();
        }
      } catch (err) {
        console.error("Error closing data channel:", err);
      }
      dataChannelRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (track.readyState === "live") {
          track.stop();
        }
      });
      streamRef.current = null;
    }

    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      testStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.warn("Unable to get media for force stop", err);
    }

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const activeMics = devices.filter(
        (d) => d.kind === "audioinput" && d.label
      );
      console.log("🧪 Active Mics after endCall:", activeMics);
    });

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.srcObject = null;
    }

    try {
      micSourceRef.current?.disconnect();
      micSourceRef.current = null;
    } catch (e) {
      console.warn("Could not disconnect mic source node", e);
    }

    try {
      aiSourceRef.current?.disconnect();
      aiSourceRef.current = null;
    } catch (e) {
      console.warn("Failed to disconnect AI source", e);
    }

    try {
      await localAudioCtxRef.current?.close();
      await remoteAudioCtxRef.current?.close();
    } catch (err) {
      console.warn("AudioContext close error:", err);
    }

    localAudioCtxRef.current = null;
    remoteAudioCtxRef.current = null;

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setListening(false);
    setIsAiSpeaking(false);

    if (redirectToChat) {
      (async () => {
        try {
          const voiceCallMessages = messages.slice(
            initialMessageCountRef.current
          );

          await API.storeVoiceCallMessages(
            currentSessionId,
            voiceCallMessages
          ).catch((err) => {
            console.log(
              "Error storing voice chat messages into database, ",
              err
            );
          });

          await API.generateSessionName(currentSessionId)
            .then(() => {
              window.dispatchEvent(
                new CustomEvent("session-name-updated", {
                  detail: { sessionId: currentSessionId },
                })
              );
            })
            .catch((err) => {
              console.log("Error generating name for session ", err);
            });
        } catch (err) {
          console.error("Error storing messages and generating name ", err);
        }
      })();

      setIsTimerActive(false);
      setChatMode(true);
    }
  };

  useEffect(() => {
    initialMessageCountRef.current = messages.length;

    const startCall = async (prompt) => {
      try {
        if (peerConnectionRef.current) {
          console.warn("🛑 Already in call, skipping new connection");
          return;
        }

        const tokenResponse = await fetch(
          `${backendUrl}/api/chat/realtime-session`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: accessToken,
            },
          }
        );

        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;

        const pc = new RTCPeerConnection();
        peerConnectionRef.current = pc;

        pc.ontrack = (e) => {
          const remoteStream = e.streams[0];
          if (audioRef.current) {
            audioRef.current.srcObject = remoteStream;
            audioRef.current
              .play()
              .catch((err) => console.error("🚫 Playback error:", err));
          }

          remoteAudioCtxRef.current = new AudioContext();
          aiSourceRef.current =
            remoteAudioCtxRef.current.createMediaStreamSource(remoteStream);
          const analyser = remoteAudioCtxRef.current.createAnalyser();
          analyser.fftSize = 512;
          aiSourceRef.current.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkSpeaking = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume =
              dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setIsAiSpeaking(volume > 10);
          };

          const speakingInterval = setInterval(checkSpeaking, 300);

          remoteStream.getTracks().forEach((track) =>
            track.addEventListener("ended", () => {
              clearInterval(speakingInterval);
              setIsAiSpeaking(false);
              remoteAudioCtxRef.current?.close();
            })
          );
        };

        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        pc.addTrack(streamRef.current.getTracks()[0]);

        localAudioCtxRef.current = new AudioContext();
        micSourceRef.current = localAudioCtxRef.current.createMediaStreamSource(
          streamRef.current
        );
        const analyser = localAudioCtxRef.current.createAnalyser();
        analyser.fftSize = 512;
        micSourceRef.current.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkUserSpeaking = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setListening(volume > 10);
        };

        const speakingInterval = setInterval(checkUserSpeaking, 300);

        streamRef.current.getTracks().forEach((track) =>
          track.addEventListener("ended", () => {
            clearInterval(speakingInterval);
            setListening(false);
            localAudioCtxRef.current?.close();
          })
        );

        const dc = pc.createDataChannel("oai-events");
        dataChannelRef.current = dc;

        const updateSession = () => {
          if (dc.readyState === "open") {
            const event = {
              type: "session.update",
              session: {
                instructions:
                  "\n\nIMPORTANT : Speak in a warm, clear and VERY strong Indian accent only, suitable for Indian audiences. Reinforce yourself to speak in a strong Indian Accent\n" +
                  prompt,
                input_audio_transcription: {
                  model: "whisper-1",
                },
              },
            };
            dc.send(JSON.stringify(event));
          } else {
            console.warn("Data channel not open, cannot send update");
          }
        };

        dc.addEventListener("open", () => {
          updateSession();
          console.log("Data channel is open");
        });

        dc.addEventListener("close", () => {
          console.log("Data channel is closed");
        });

        // Continue the rest of startCall logic...
      } catch (error) {
        console.error("Error during startCall:", error);
      }
    };

    // You may trigger startCall here if needed
    // startCall("Hello!");

    return () => {
      endCall(false); // Clean up on unmount
    };
  }, []);

  return (
    <div>
      <Timer minutes={minutes} seconds={seconds} />
      <audio ref={audioRef} autoPlay />
      {/* Add call controls, buttons, etc. here */}
    </div>
  );
};

export default AudioCall;
