// src/hooks/useChatSender.js
import { useState, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import { getGeminiResponse } from "../utils/geminiService";
import { cleanText } from "../utils/cleanText";

// Set PDF.js worker source (should be done once globally or in the hook if specific to it)
// It's generally better to keep this global if pdfjs is used across multiple components.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const arrayBufferReader = new FileReader();
    arrayBufferReader.onload = () => resolve(arrayBufferReader.result);
    arrayBufferReader.onerror = (error) => reject(error);
    arrayBufferReader.readAsArrayBuffer(file);
  });
};

const parsePdfBytesToText = async (pdfBytes) => {
  try {
    const pdfDocument = await pdfjs.getDocument({ data: pdfBytes }).promise;
    let fullText = "";

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  } catch (error) {
    console.error("Error parsing PDF with pdfjs-dist:", error);
    throw new Error("Failed to extract text from PDF using pdfjs-dist.");
  }
};

const useChatSender = (
  messages,
  setMessages,
  setInput,
  setAttachedFile,
  setFilePreview
) => {
  const [loading, setLoading] = useState(false);

  const handleSend = useCallback(
    async (input, attachedFile) => {
      if (input.trim() === "" && !attachedFile) return;

      let userMessageText = input;
      let geminiInputContent = input;
      let currentFilePreview = null; // Store file preview for user message

      if (attachedFile) {
        userMessageText = `📎 Attached: ${attachedFile.name}`;
        if (input.trim() !== "") {
          userMessageText += `\n${input}`;
        }

        setLoading(true);

        try {
          const fileType = attachedFile.type;
          if (fileType.startsWith("image/")) {
            currentFilePreview = URL.createObjectURL(attachedFile);
            const fileContent = await readFileAsBase64(attachedFile);
            geminiInputContent = [
              { text: input },
              {
                inlineData: {
                  mimeType: fileType,
                  data: fileContent,
                },
              },
            ];
          } else if (fileType.startsWith("text/")) {
            const fileContent = await readFileAsBase64(attachedFile);
            geminiInputContent = `${input}\n${atob(fileContent)}`;
          } else if (fileType === "application/pdf") {
            try {
              const pdfBytes = await readFileAsArrayBuffer(attachedFile);
              const extractedText = await parsePdfBytesToText(pdfBytes);
              geminiInputContent = `${input}\nPDF Content:\n${extractedText}`;
            } catch (pdfError) {
              console.error("Error processing PDF:", pdfError);
              setMessages((prev) => [
                ...prev,
                {
                  sender: "assistant",
                  text: `Could not process PDF: ${pdfError.message}`,
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ]);
              setLoading(false);
              return;
            }
          } else if (
            fileType === "application/msword" ||
            fileType ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) {
            geminiInputContent = `${input}\nAttached file: ${attachedFile.name} (Type: ${fileType})\nNote: Direct content extraction for this document type is not supported in this demo.`;
            alert(
              "Direct content extraction for Word documents (.doc, .docx) is not fully supported in this demo. Sending file name only to AI."
            );
          } else {
            geminiInputContent = `${input}\nAttached file: ${attachedFile.name} (Type: ${fileType})`;
            alert(
              "Unsupported file type for direct AI processing. Sending file name only."
            );
          }
        } catch (error) {
          console.error("Error reading file:", error);
          setLoading(false);
          setMessages((prev) => [
            ...prev,
            {
              sender: "assistant",
              text: "Could not read file content. Please try again.",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
          return;
        }
      }

      const userMessage = {
        sender: "user",
        text: userMessageText,
        file: attachedFile ? attachedFile.name : null,
        filePreview: currentFilePreview, // Use the dynamically set preview
        fileType: attachedFile ? attachedFile.type : null,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const currentConversationHistory = [...messages, userMessage];
      setMessages(currentConversationHistory);
      setInput("");
      setAttachedFile(null);
      setFilePreview(null); // Clear file preview after sending

      if (!attachedFile) setLoading(true);

      try {
        const response = await getGeminiResponse(
          geminiInputContent,
          currentConversationHistory
        );
        const plainText = cleanText(response);

        const assistantMessage = {
          sender: "assistant",
          text: plainText,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error fetching Gemini response:", error);
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: "Oops! Something went wrong getting an AI response. Please try again.",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, setMessages, setInput, setAttachedFile, setFilePreview] // Dependencies for useCallback
  );

  return { handleSend, loading, setLoading };
};

export default useChatSender;
