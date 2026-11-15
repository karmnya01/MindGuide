import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getAvatarSrc } from "../utils/avatar";
import { faUsers, faPlus, faSearch, faRocket, faBrain, faCompass, faChevronRight, faTimes, faFire, faGraduationCap } from "@fortawesome/free-solid-svg-icons";

const CATEGORIES = ["DSA", "Web Dev", "Full Stack", "AI/ML", "Exams", "Design", "General"];

const StudyRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoom, setNewRoom] = useState({
        roomName: "",
        description: "",
        category: "General",
        maxParticipants: 10
    });
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/v1/rooms?search=${searchQuery}&category=${selectedCategory}`);
            if (data.success) setRooms(data.data);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
          fetchRooms();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory]);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post("/api/v1/rooms", newRoom);
            if (data.success) {
                setShowCreateModal(false);
                navigate(`/study-rooms/${data.data._id}`);
            }
        } catch (err) {
            console.error("Failed to create room", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 md:px-12 font-sans selection:bg-indigo-100 no-scrollbar">
            <div className="max-w-7xl mx-auto">
                <header className="mb-16">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-12 border-b border-slate-200 pb-12">
                        <div>
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <FontAwesomeIcon icon={faUsers} className="text-white text-sm" />
                                </div>
                                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600">Collaborative Matrix</span>
                            </motion.div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Study <span className="text-indigo-600">Rooms.</span></h1>
                            <p className="text-slate-500 mt-4 max-w-xl font-medium">Join real-time focus environments. Collaborate on roadmaps, solve assessments, and grow faster with the community.</p>
                        </div>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-slate-900 hover:bg-indigo-600 text-white font-black px-10 py-5 rounded-2xl transition-all shadow-xl text-[10px] uppercase tracking-widest active:scale-95 flex items-center gap-3"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Launch Private Space
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="relative flex-1 group">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search room name, tags, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-8 text-slate-900 outline-none focus:border-indigo-600 transition-all font-medium text-sm shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
                            {["All", ...CATEGORIES].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                        selectedCategory === cat 
                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                                        : "bg-white text-slate-400 border-slate-200 hover:border-indigo-600 hover:text-indigo-600"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
                    {loading ? (
                        [1,2,3].map(i => (
                            <div key={i} className="h-80 bg-white border border-slate-200 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : rooms.length === 0 ? (
                        <div className="col-span-full py-32 text-center bg-white border border-slate-200 rounded-[3.5rem] shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                                <FontAwesomeIcon icon={faCompass} className="text-slate-300 text-3xl" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Zero Active Signals</h3>
                            <p className="text-slate-500 max-w-md mx-auto font-medium text-lg mb-10">Be the first to architect a collaborative neural hub for your chosen category.</p>
                            <button onClick={() => setShowCreateModal(true)} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl">
                                Initialize First Room
                            </button>
                        </div>
                    ) : (
                        rooms.map((room) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={room._id}
                                onClick={() => navigate(`/study-rooms/${room._id}`)}
                                className="group cursor-pointer bg-white border border-slate-200 rounded-[3rem] p-10 hover:border-indigo-600 transition-all duration-500 flex flex-col shadow-sm hover:shadow-2xl hover:shadow-indigo-50"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                            <FontAwesomeIcon icon={faFire} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">{room.category}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Sync</p>
                                        </div>
                                    </div>
                                    <div className="flex -space-x-3">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                                                <img src={`https://i.pravatar.cc/100?u=${room._id}${i}`} alt="user" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                            +{room.participants.length}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 group-hover:text-indigo-600 transition-colors leading-none">{room.roomName}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed mb-10 line-clamp-2 pr-6 italic">"{room.description}"</p>
                                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 overflow-hidden">
                                           <img src={getAvatarSrc(room.createdBy?.pic)} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = "/default-avatar.svg"; }} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Host: {room.createdBy?.name || "Neural Assistant"}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showCreateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white border border-slate-200 rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl relative">
                            <button onClick={() => setShowCreateModal(false)} className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 transition-all">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                            <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mb-8 mx-auto shadow-xl shadow-indigo-100">
                                <FontAwesomeIcon icon={faRocket} className="text-2xl" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tighter">Architect Room</h3>
                            <p className="text-slate-500 text-center mb-10 font-medium">Initialize a new synchronized focus hub.</p>
                            
                            <form onSubmit={handleCreateRoom} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Designation</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                                        placeholder="Enter Room Name"
                                        value={newRoom.roomName}
                                        onChange={(e) => setNewRoom({...newRoom, roomName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Context Summary</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium resize-none"
                                        placeholder="What are we studying?"
                                        rows={3}
                                        value={newRoom.description}
                                        onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 text-slate-900 outline-none focus:border-indigo-600 font-black text-[10px] uppercase tracking-widest"
                                            value={newRoom.category}
                                            onChange={(e) => setNewRoom({...newRoom, category: e.target.value})}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Uplinks</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-slate-900 outline-none focus:border-indigo-600 font-black"
                                            value={newRoom.maxParticipants}
                                            onChange={(e) => setNewRoom({...newRoom, maxParticipants: parseInt(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-7 rounded-[2.5rem] mt-4 transition-all shadow-xl active:scale-95 text-[10px] uppercase tracking-[0.3em]">
                                    Initialize Portal
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudyRooms;
