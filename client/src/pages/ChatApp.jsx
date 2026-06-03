/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faPaperPlane,
  faBrain,
  faRobot,
  faUser,
  faVolumeUp,
  faGlobe,
  faCheckCircle,
  faFilePdf,
  faSignOutAlt,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { motion, useAnimation } from "framer-motion";
import AssistantAvatar from "../components/AssistantAvatar";
import ScrollableFeed from "react-scrollable-feed";
import ReportModal from "../components/ReportModal";
import ReactMarkdown from "react-markdown";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import InteractiveRoadmap from "../components/InteractiveRoadmap";
import EmotionIndicator from "../components/chat/EmotionIndicator";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const VOICE_PROFILES = {
  English: {
    voiceId: "CwhRBWXzGAHq8TQ4Fs17",
    langCode: "en-IN",
  },
  Hindi: {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    langCode: "hi-IN",
  },
};

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [renderContent, setRenderContent] = useState([]);
  const inputElement = useRef(null);
  const [loading, setLoading] = useState(false);
  const { type } = useParams();
  const [report, setReport] = useState();
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const { type: counsellorType } = useParams();
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.92);
  const [language, setLanguage] = useState("English");
  const [stressScore, setStressScore] = useState(null);
  const [stressHistory, setStressHistory] = useState([]);
  const currentAudioRef = useRef(null);
  const currentAudioUrlRef = useRef(null);
  const ttsAbortRef = useRef(null); // AbortController for in-flight TTS requests
  const isMountedRef = useRef(true); // track mount state to prevent post-unmount playback
  const [messageEmotions, setMessageEmotions] = useState({});
  const [showMoodChart, setShowMoodChart] = useState(false);
  const messagesEndRef = useRef(null);
  const [ttsBanner, setTtsBanner] = useState(null); // { type: 'error'|'warning'|'info', title, message }

  const stopAllAudio = () => {
    // Abort any in-flight TTS API request
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    SpeechRecognition.stopListening();
  };

  // Stop all audio/speech when navigating away from chat
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopAllAudio();
    };
  }, []);

  const startListening = () => {
    if (!isRecognitionListening) {
      stopAllAudio();
      const langCode = VOICE_PROFILES[language]?.langCode || "en-IN";
      SpeechRecognition.startListening({
        continuous: true,
        language: langCode,
      });
    } else {
      // # Conversation Logs
      SpeechRecognition.stopListening();
    }
  };

  const microphoneAnimationControls = useAnimation();
  const { transcript, listening: isRecognitionListening } =
    useSpeechRecognition();

  useEffect(() => {
    if (isRecognitionListening) {
      setInputText(transcript);
    }
  }, [transcript, isRecognitionListening]);

  const generateText = async () => {
    const textToSend = inputText.trim();
    if (textToSend === "") return;

    const userMessage = {
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    try {
      const response = await axios.post("/api/v1/chat", {
        messages: [...messages, userMessage],
        counsellorType,
      });

      if (response.status === 200) {
        const { text, stressScore: newScore, toneAnalysis } = response.data;
        const botMessage = { role: "assistant", content: text };
        setMessages((prev) => [...prev, botMessage]);

        if (newScore !== undefined && newScore !== null) {
          setStressScore(newScore);
          setStressHistory((prev) => [...prev, newScore]);
        }

        if (toneAnalysis?.topLabel) {
          const userMsgIdx = messages.length;
          setMessageEmotions((prev) => ({
            ...prev,
            [userMsgIdx]: toneAnalysis.topLabel,
          }));
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast.error(err.response?.data || "Failed to generate response");
    } finally {
      setLoading(false);
    }
  };

  const handleWrapSession = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/v1/insights/debrief", {
        counsellorType,
      });
      if (response.status === 200) {
        const debrief = response.data.data;
        const debriefMessage = {
          role: "assistant",
          content: `### Session Debrief\n\n**Summary:** ${debrief.summary}\n\n**Insights:**\n${debrief.keyInsights.map((i) => `- ${i}`).join("\n")}\n\n**Next Step:** ${debrief.nextAction}\n\n*"${debrief.counselorQuote}"*\n\nWould you like to architect this session into a permanent strategic roadmap on your **Journey Map**?`,
          isDebrief: true,
          showRoadmapOptions: true,
        };
        setMessages((prev) => [...prev, debriefMessage]);
        toast.success("Session wrapped! Protocol complete.");
      }
    } catch (err) {
      console.error("Debrief failed", err);
      toast.error(err.response?.data?.error || "Failed to wrap session");
    } finally {
      setLoading(false);
    }
  };

  const HandleReportGenerate = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/v1/chat/report", {
        chat: messages,
        userName: userInfo?.name,
        counsellorType,
      });
      if (response.status === 200) {
        setReport(response.data);
        setReportModalOpen(true);
      }
    } catch (err) {
      console.error("Error in generating report", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userInfo) return;
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/v1/chat/${type}?language=${language}`,
        );
        if (response.status === 200) setMessages(response.data);
      } catch (err) {
        console.error("Error in fetching messages", err);
      }
    };
    fetchData();
  }, [type, userInfo, language]);

  // --- TTS Banner helper ---
  const showTtsBanner = (type, title, message) => {
    setTtsBanner({ type, title, message });
    setTimeout(() => setTtsBanner(null), 7000);
  };

  // --- Browser fallback TTS ---
  const fallbackSpeak = (text, langName) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackSpeed;
    utterance.lang = VOICE_PROFILES[langName]?.langCode || "en-IN";
    // Try to pick a matching voice
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) =>
      v.lang.startsWith(utterance.lang.split("-")[0]),
    );
    if (match) utterance.voice = match;
    window.speechSynthesis.speak(utterance);
  };

  const speakMessage = async (content, langName) => {
    stopAllAudio();
    const cleanContent = content.replace(/[*_#`[\]()]/g, "").trim();
    if (!cleanContent) return;

    // Create an AbortController so we can cancel this request on unmount/new speak
    const abortController = new AbortController();
    ttsAbortRef.current = abortController;

    try {
      const response = await axios.post(
        "/api/v1/chat/tts",
        {
          text: cleanContent,
          language: langName,
          playbackSpeed: playbackSpeed,
          voiceId: VOICE_PROFILES[langName]?.voiceId,
        },
        { responseType: "blob", signal: abortController.signal },
      );

      // If component unmounted or request was aborted while awaiting, bail out
      if (!isMountedRef.current || abortController.signal.aborted) return;

      // ElevenLabs may return JSON error inside a blob — detect it
      const blob = response.data;
      if (blob.type && blob.type.includes("application/json")) {
        const errorText = await blob.text();
        let parsed = {};
        try {
          parsed = JSON.parse(errorText);
        } catch (_) {}
        const reason =
          parsed.error || parsed.detail?.message || "Unknown ElevenLabs error";
        throw new Error(`ElevenLabs: ${reason}`);
      }

      // Double-check mount state before playing
      if (!isMountedRef.current) return;

      const audioBlob = new Blob([blob], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackSpeed;
      currentAudioRef.current = audio;
      currentAudioUrlRef.current = audioUrl;

      // Handle audio playback errors
      audio.onerror = () => {
        if (!isMountedRef.current) return;
        console.error("Audio playback failed, falling back to browser TTS");
        showTtsBanner(
          "warning",
          "Audio Playback Failed",
          "The audio file could not be played. Using browser voice instead.",
        );
        fallbackSpeak(cleanContent, langName);
      };

      await audio.play();
    } catch (error) {
      // If aborted (user navigated away or clicked another speak), silently exit
      if (
        axios.isCancel(error) ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      )
        return;
      if (!isMountedRef.current) return;

      console.error("TTS failed:", error);

      // Determine the issue for the banner
      let issueTitle = "Voice Synthesis Failed";
      let issueMessage =
        "An unknown error occurred. Using browser voice as fallback.";

      if (error.response) {
        // Server returned an error status
        const status = error.response.status;
        if (status === 401 || status === 403) {
          issueTitle = "ElevenLabs API Key Invalid";
          issueMessage =
            "The API key is unauthorized or expired. Falling back to browser voice.";
        } else if (status === 429) {
          issueTitle = "ElevenLabs Quota Exceeded";
          issueMessage =
            "API rate limit or character quota reached. Using browser voice.";
        } else if (status === 500) {
          issueTitle = "Server Configuration Error";
          issueMessage =
            "ElevenLabs API key may not be configured on the server. Using browser voice.";
        } else {
          issueTitle = `ElevenLabs Error (${status})`;
          // Try to extract message from blob response
          try {
            const errBlob = error.response.data;
            const errText =
              typeof errBlob === "string" ? errBlob : await errBlob?.text?.();
            if (errText) {
              const parsed = JSON.parse(errText);
              issueMessage =
                parsed.error ||
                parsed.detail?.message ||
                `Request failed with status ${status}. Using browser voice.`;
            }
          } catch (_) {
            issueMessage = `Request failed with status ${status}. Using browser voice.`;
          }
        }
      } else if (error.message?.includes("ElevenLabs:")) {
        issueTitle = "ElevenLabs API Error";
        issueMessage =
          error.message.replace("ElevenLabs: ", "") + " Using browser voice.";
      } else if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network")
      ) {
        issueTitle = "Network Error";
        issueMessage =
          "Cannot reach the server. Check your connection. Using browser voice.";
      }

      showTtsBanner("error", issueTitle, issueMessage);
      fallbackSpeak(cleanContent, langName);
    }
  };

  useEffect(() => {
    setRenderContent(
      messages.map((message, index) => {
        const isUserMessage = message.role === "user";
        const isSystem = message.role === "system";
        if (isSystem) return null;
        const emotion = isUserMessage ? messageEmotions[index] : null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            key={index}
            className={`flex w-full mb-8 ${isUserMessage ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex gap-5 max-w-[85%] md:max-w-[75%] ${isUserMessage ? "flex-row-reverse" : "flex-row"}`}
            >
              {!isUserMessage && (
                <div className="shrink-0 flex flex-col justify-end">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm overflow-hidden">
                    <AssistantAvatar />
                  </div>
                </div>
              )}

              <div
                className={`group relative flex flex-col gap-2 ${isUserMessage ? "items-end" : "items-start"}`}
              >
                <p
                  className={`text-[9px] font-black uppercase tracking-widest px-2 ${isUserMessage ? "text-slate-400" : "text-indigo-600"}`}
                >
                  {isUserMessage ? "Commander" : "Neural Mentor"}
                </p>
                <div
                  className={`px-6 py-5 shadow-sm text-[15px] leading-relaxed ${
                    isUserMessage
                      ? "bg-indigo-600 text-white rounded-3xl rounded-br-none"
                      : "bg-white border border-slate-200 text-slate-700 rounded-3xl rounded-bl-none shadow-sm"
                  }`}
                  style={{ overflowWrap: 'break-word', wordBreak: 'break-word', minWidth: 0 }}
                >
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        if (!inline && match && match[1] === "roadmap") {
                          try {
                            const steps = JSON.parse(
                              String(children).replace(/\n/g, ""),
                            );
                            return (
                              <InteractiveRoadmap
                                data={steps}
                                trackTitle={steps[0]?.title}
                              />
                            );
                          } catch (err) {
                            console.error("Roadmap parse error:", err);
                          }
                        }
                        return !inline ? (
                          <pre
                            className="bg-slate-50 p-5 rounded-2xl mt-4 overflow-x-auto text-sm border border-slate-100 font-mono"
                            {...props}
                          >
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code
                            className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[13px] font-semibold font-mono border border-indigo-100"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => {
                        const text =
                          typeof children === "string"
                            ? children
                            : Array.isArray(children)
                              ? children
                                  .map((c) => (typeof c === "string" ? c : ""))
                                  .join("")
                              : "";
                        if (
                          text.includes("━━━━━━━━━━") ||
                          text.match(/[█░▓]{6,}/)
                        ) {
                          return null;
                        }
                        if (text.startsWith("[[STRESS_LEVEL")) {
                          return null;
                        }
                        return (
                          <p className={`mb-3 last:mb-0 text-[14px] leading-relaxed ${isUserMessage ? 'text-white' : 'text-slate-700'}`}>
                            {children}
                          </p>
                        );
                      },
                      strong: ({ children }) => (
                        <strong className="font-extrabold text-slate-900">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-indigo-600 not-italic font-semibold">
                          {children}
                        </em>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="text-indigo-600 font-semibold hover:underline decoration-indigo-300 underline-offset-2"
                        >
                          {children}
                        </a>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-black text-slate-900 mt-6 mb-3 tracking-tight">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-slate-900 mt-5 mb-2.5 tracking-tight">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2 tracking-tight">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-base font-bold text-slate-900 mt-3 mb-1.5 tracking-tight">
                          {children}
                        </h4>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-none pl-1 mb-4 space-y-1.5 text-slate-700">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-none pl-1 mb-4 space-y-1.5 text-slate-700">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-[14px] leading-relaxed mb-1 pl-2">
                          {children}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-500 pl-5 py-4 my-5 bg-gradient-to-r from-indigo-50/90 to-slate-50/50 rounded-r-2xl shadow-sm text-slate-700 text-[14px] leading-relaxed">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-5 border border-slate-200/80 rounded-2xl shadow-sm bg-white">
                          <table className="min-w-full divide-y divide-slate-200 text-[13px]">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gradient-to-r from-indigo-50/80 to-slate-50/80">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-5 py-3.5 text-left font-black uppercase tracking-wider text-indigo-700 text-[10px]">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-5 py-3 whitespace-nowrap text-slate-600 border-t border-slate-100 font-medium">
                          {children}
                        </td>
                      ),
                      hr: () => (
                        <hr className="my-6 border-t border-slate-200/60" />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {message.showRoadmapOptions && (
                    <div className="mt-8 flex flex-col md:flex-row gap-3">
                      <button
                        onClick={() => {
                          HandleReportGenerate();
                        }}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 shadow-indigo-100"
                      >
                        Yes, Architect Path
                      </button>
                      <button
                        onClick={() => {
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "assistant",
                              content:
                                "Understood. Session context has been archived in your Neural Vault. See you soon!",
                            },
                          ]);
                        }}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                      >
                        No, Just Archive
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center gap-3 px-2 ${isUserMessage ? "justify-end" : "justify-start"}`}
                >
                  {isUserMessage && emotion && (
                    <EmotionIndicator emotion={emotion} />
                  )}
                  {!isUserMessage && (
                    <button
                      onClick={() => speakMessage(message.content, language)}
                      className="opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-indigo-600"
                    >
                      <FontAwesomeIcon icon={faVolumeUp} className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      }),
    );
  }, [messages, messageEmotions, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {report && (
        <ReportModal
          report={report}
          open={isReportModalOpen}
          messages={messages}
          stressHistory={stressHistory}
        />
      )}

      {/* TTS Error/Fallback Banner */}
      {ttsBanner && (
        <motion.div
          initial={{ opacity: 0, x: 80, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-6 right-6 z-[9999] max-w-sm w-full"
        >
          <div
            className={`relative rounded-2xl border shadow-2xl backdrop-blur-xl px-5 py-4 ${
              ttsBanner.type === "error"
                ? "bg-red-50/95 border-red-200 shadow-red-100/50"
                : ttsBanner.type === "warning"
                  ? "bg-amber-50/95 border-amber-200 shadow-amber-100/50"
                  : "bg-blue-50/95 border-blue-200 shadow-blue-100/50"
            }`}
          >
            <button
              onClick={() => setTtsBanner(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none font-bold"
              aria-label="Dismiss"
            >
              ×
            </button>
            <div className="flex items-start gap-3">
              <div
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  ttsBanner.type === "error"
                    ? "bg-red-100 text-red-600"
                    : ttsBanner.type === "warning"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {ttsBanner.type === "error"
                  ? "✕"
                  : ttsBanner.type === "warning"
                    ? "⚠"
                    : "ℹ"}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[11px] font-black uppercase tracking-widest mb-1 ${
                    ttsBanner.type === "error"
                      ? "text-red-700"
                      : ttsBanner.type === "warning"
                        ? "text-amber-700"
                        : "text-blue-700"
                  }`}
                >
                  {ttsBanner.title}
                </p>
                <p className="text-[13px] text-slate-600 leading-snug">
                  {ttsBanner.message}
                </p>
              </div>
            </div>
            {/* Auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 7, ease: "linear" }}
                className={`h-full ${
                  ttsBanner.type === "error"
                    ? "bg-red-400"
                    : ttsBanner.type === "warning"
                      ? "bg-amber-400"
                      : "bg-blue-400"
                }`}
              />
            </div>
          </div>
        </motion.div>
      )}

      <header className="h-24 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-8 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <AssistantAvatar />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tighter leading-none mb-1">
              {counsellorType} Mentor{" "}
              <span className="text-indigo-600">Alpha.</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Core Interface Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8 bg-slate-50 border border-slate-100 px-6 py-2.5 rounded-2xl">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none pt-0.5">
                Stability
              </span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(10 - (stressScore || 2)) * 10}%` }}
                />
              </div>
            </div>
            <select
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">EN</option>
              <option value="Hindi">HI</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={HandleReportGenerate}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 shadow-indigo-100"
            >
              Analyze Deep
            </button>
          </div>

          <div className="w-px h-8 bg-slate-200 mx-2" />

          <Link
            to="/account/dashboard/profile"
            className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-indigo-600 transition-all shadow-sm group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-100">
              <img
                src={userInfo?.pic}
                alt={userInfo?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 group-hover:text-indigo-600 transition-colors">
              Profile
            </span>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-12 relative bg-white/50 backdrop-blur-3xl no-scrollbar">
        <div className="max-w-4xl mx-auto flex flex-col">
          <ScrollableFeed className="flex flex-col gap-4 w-full pr-2">
            {renderContent}
            {loading && (
              <div className="flex justify-start mb-8">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl rounded-bl-sm shadow-sm flex gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollableFeed>
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 px-8 py-8 shrink-0 z-20">
        <div className="max-w-4xl mx-auto flex items-end gap-5">
          <button
            onClick={startListening}
            className={`shrink-0 w-14 h-14 rounded-2xl border-2 transition-all ${isRecognitionListening ? "bg-rose-50 border-rose-500 text-rose-500 shadow-lg shadow-rose-100" : "bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm"}`}
          >
            <FontAwesomeIcon icon={faMicrophone} className="text-lg" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputElement}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              placeholder="Record your thoughts or type here..."
              className="w-full bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-400 rounded-2xl px-8 py-5 pr-20 outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none font-medium text-[15px]"
              rows={1}
              style={{ minHeight: "64px", maxHeight: "160px" }}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.preventDefault(), generateText())
              }
            />
            <div className="absolute right-3 bottom-2.5">
              <button
                onClick={generateText}
                disabled={inputText.trim() === "" || loading}
                className="w-11 h-11 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-lg active:scale-90 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-4 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Neural Signal Secured • Active Protocol V4.2
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
