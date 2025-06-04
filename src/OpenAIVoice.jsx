// src/App.js
import React, { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

const OpenAIVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseText, setResponseText] = useState("");
  const audioRef = useRef(null);
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const mediaStream = useRef(null);
  const audioContext = useRef(null);
  const processorNode = useRef(null);
  const sourceNode = useRef(null);

  async function init() {
    setIsLoading(true);
    try {
      const tokenResponse = await fetch("http://localhost:9000/session");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret;

      console.log("client_secret ----------", EPHEMERAL_KEY);
      

      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      pc.addTrack(stream.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      dc.onopen = () => {
        console.log("DataChannel is open");

        dc.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: "Hello! Tell me a fun fact.",
            },
          })
        );

        startAudioStreaming();

        setIsRecording(true);
        setIsLoading(false);
      };

      dc.onmessage = (e) => {
        setResponseText((prev) => prev + e.data);
        console.log("OpenAI Response: ", e.data);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
    } catch (error) {
      console.error("Voice initialization failed:", error);
      setIsLoading(false);
    }
  }

  function startAudioStreaming() {
    if (!mediaStream.current) return;

    audioContext.current = new AudioContext();

    sourceNode.current = audioContext.current.createMediaStreamSource(
      mediaStream.current
    );

    processorNode.current = audioContext.current.createScriptProcessor(
      4096,
      1,
      1
    );

    processorNode.current.onaudioprocess = (e) => {
      if (
        !isRecording ||
        !dataChannel.current ||
        dataChannel.current.readyState !== "open"
      )
        return;

      const inputBuffer = e.inputBuffer.getChannelData(0);

      const pcm16Buffer = floatTo16BitPCM(inputBuffer);

      dataChannel.current.send(pcm16Buffer);
    };

    sourceNode.current.connect(processorNode.current);
    processorNode.current.connect(audioContext.current.destination);
  }

  function floatTo16BitPCM(input) {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, s, true);
    }
    return buffer;
  }

  const stopRecording = () => {
    setIsRecording(false);
    setResponseText("");
    mediaStream.current?.getTracks().forEach((t) => t.stop());
    mediaStream.current = null;

    processorNode.current?.disconnect();
    sourceNode.current?.disconnect();
    audioContext.current?.close();

    processorNode.current = null;
    sourceNode.current = null;
    audioContext.current = null;

    peerConnection.current?.close();
    peerConnection.current = null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">AI Voice Assistant</h1>

      <div className="bg-white p-6 rounded-2xl shadow-xl w-11/12 max-w-md text-center">
        <p className="text-lg mb-6">
          Talk to the AI by clicking the mic button
        </p>

        <button
          onClick={isRecording ? stopRecording : init}
          className={`p-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-110 ${
            isRecording ? "bg-red-500" : "bg-green-500"
          } text-white`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : isRecording ? (
            <MicOff size={32} />
          ) : (
            <Mic size={32} />
          )}
        </button>

        <div className="mt-6">
          <p className="font-semibold">AI Response:</p>
          <div className="mt-2 bg-gray-100 p-4 rounded-xl min-h-[100px]">
            {responseText ? (
              <p className="animate-pulse text-blue-700 whitespace-pre-wrap">
                {responseText}
              </p>
            ) : (
              <p className="text-gray-500">Waiting for AI response...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenAIVoice;
