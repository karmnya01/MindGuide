import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faStopwatch, faUsers, faSignOutAlt, faSmile, faBrain, faRocket, faCheckCircle, faClock } from "@fortawesome/free-solid-svg-icons";

const LiveRoom = () => {
    const { id: roomId } = useParams();
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.mindGuide.userInfo);
    const [roomData, setRoomData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [participants, setParticipants] = useState([]);
    const [timer, setTimer] = useState(0);
    const [isCounting, setIsCounting] = useState(false);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const chatEndRef = useRef(null);

    // Initial Fetch
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const { data } = await axios.get(`/api/v1/rooms/${roomId}`);
                if (data.success) {
                    setRoomData(data.data.room);
                    setMessages(data.data.messages);
                    setParticipants(data.data.room.participants);
                }
            } catch (err) {
                console.error(err);
                navigate("/study-rooms");
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [roomId, navigate]);

    // Socket Setup
    useEffect(() => {
        if (!userInfo) return;

        socketRef.current = io(API_BASE_URL, {
            withCredentials: true,
        });

        socketRef.current.emit("join_room", { roomId, user: userInfo });

        socketRef.current.on("new_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socketRef.current.on("user_joined", ({ user }) => {
            setParticipants((prev) => {
                if (prev.find(p => p._id === user._id)) return prev;
                return [...prev, user];
            });
        });

        socketRef.current.on("user_left", ({ userId }) => {
            setParticipants((prev) => prev.filter(p => p._id !== userId));
        });

        socketRef.current.on("focus_session_started", ({ duration }) => {
            setTimer(duration * 60);
            setIsCounting(true);
        });

        socketRef.current.on("timer_updated", (timeLeft) => {
            setTimer(timeLeft);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.emit("leave_room", { roomId, user: userInfo });
                socketRef.current.disconnect();
            }
        };
    }, [roomId, userInfo]);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (isCounting && timer > 0) {
            interval = setInterval(() => {
                setTimer((t) => t - 1);
            }, 1000);
        } else if (timer === 0 && isCounting) {
            setIsCounting(false);
        }
        return () => clearInterval(interval);
    }, [isCounting, timer]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        try {
            const { data } = await axios.post(`/api/v1/rooms/${roomId}/message`, {
                content: input,
            });
            if (data.success) {
                socketRef.current.emit("send_message", { roomId, message: data.data });
                setInput("");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleStartSession = async (duration = 25) => {
        try {
            await axios.post(`/api/v1/rooms/${roomId}/session/start`, {
                goal: "Group Focus Session",
                duration,
            });
            socketRef.current.emit("start_focus_session", { roomId, duration });
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Live Protocol...</p>
        </div>
    );

    return (
        <div className="h-screen bg-[#F8FAFC] flex overflow-hidden font-sans selection:bg-indigo-100 no-scrollbar">
            {/* Sidebar - Participants */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
                <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                            <FontAwesomeIcon icon={faUsers} className="text-sm" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Participants</h2>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Active Links</span>
                         <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black">{participants.length}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                    {participants.map((p) => (
                        <div key={p._id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                                    <img src={p.pic} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">{p.name || "Anonymous"}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Focused Mode</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t border-slate-100">
                    <button 
                        onClick={() => navigate("/study-rooms")}
                        className="w-full py-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-slate-100"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" /> Sever Link
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                           <FontAwesomeIcon icon={faBrain} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">{roomData?.roomName}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{roomData?.category} // Synchronized Workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {isCounting ? (
                            <div className="flex items-center gap-4 px-6 py-3 bg-slate-900 rounded-2xl shadow-xl">
                                <FontAwesomeIcon icon={faClock} className="text-indigo-400 animate-pulse" />
                                <span className="text-xl font-black text-white font-mono tracking-widest">{formatTime(timer)}</span>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleStartSession(25)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-3"
                            >
                                <FontAwesomeIcon icon={faStopwatch} /> Start Focus Sprint
                            </button>
                        )}
                    </div>
                </header>

                {/* Chat Display */}
                <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-slate-50/50">
                    {messages.map((m, idx) => {
                        const isMe = m.sender?._id === userInfo?._id;
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={m._id || idx} 
                                className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm">
                                    <img src={m.sender?.pic} className="w-full h-full object-cover" />
                                </div>
                                <div className={`max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.sender?.name}</p>
                                        <p className="text-[8px] text-slate-300">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                                        {m.content}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <footer className="p-8 bg-white border-t border-slate-200">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-3xl p-2 focus-within:border-indigo-600 focus-within:bg-white transition-all shadow-inner">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                            <FontAwesomeIcon icon={faSmile} />
                        </div>
                        <input 
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none py-4 px-2 text-slate-900 font-bold placeholder-slate-400"
                            placeholder="Collaborate with your team..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg">
                            <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                        </button>
                    </form>
                </footer>
            </main>

            {/* Stats/Roadmap Sidebar (Optional/Toggled) */}
            <aside className="hidden xl:flex w-96 bg-white border-l border-slate-200 flex-col shadow-sm">
                 <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <FontAwesomeIcon icon={faRocket} className="text-sm" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Room Growth</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Room XP Pool</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{(roomData?.roomXP || 0).toLocaleString()} <span className="text-xs text-indigo-600">XP</span></p>
                            <div className="mt-4 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full w-[65%]" />
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Room Achievements</p>
                           <div className="space-y-3">
                              {[
                                { t: "Early Birds", d: "First session before 8 AM", d1: "20/20" },
                                { t: "Unstoppable", d: "10-hour collective sprint", d1: "4.2/10" }
                              ].map(a => (
                                <div key={a.t} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                   <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px]">
                                      <FontAwesomeIcon icon={faCheckCircle} />
                                   </div>
                                   <div className="flex-1">
                                      <p className="text-[10px] font-black text-slate-900 leading-none mb-1">{a.t}</p>
                                      <p className="text-[8px] font-bold text-slate-400 leading-none">{a.d}</p>
                                   </div>
                                   <p className="text-[8px] font-black text-indigo-600">{a.d1}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                    </div>
                 </div>
                 
                 <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Shared Roadmap</p>
                    <div className="relative pl-6 space-y-8 border-l-2 border-slate-100 ml-2">
                        {[
                          { t: "Deep Core Review", s: "Completed" },
                          { t: "Live Logic Building", s: "Ongoing" },
                          { t: "Final Deployment", s: "Pending" }
                        ].map((node, i) => (
                           <div key={i} className="relative">
                              <div className={`absolute -left-[33px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${node.s === 'Completed' ? 'bg-emerald-500' : node.s === 'Ongoing' ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200'}`} />
                              <p className="text-[11px] font-black text-slate-900 mb-1">{node.t}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{node.s}</p>
                           </div>
                        ))}
                    </div>
                 </div>
            </aside>
        </div>
    );
};

export default LiveRoom;
