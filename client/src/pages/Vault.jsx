import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faTrash, faShieldAlt, faCheckCircle, faChevronRight, faDatabase, faHistory } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const Vault = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const { data } = await axios.get("/api/v1/user/memories");
        if (data.success) {
          setMemories(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch memories", err);
        // toast.error("Failed to synchronize with neural vault.");
      } finally {
        setLoading(false);
      }
    };
    fetchMemories();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/v1/user/memories/${id}`);
      setMemories(memories.filter((m) => m._id !== id));
      toast.success("Memory purged from neural map.");
    } catch (err) {
      toast.error("Failed to purge record.");
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10">
           <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Intelligence Crypt...</p>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 font-sans selection:bg-indigo-100 no-scrollbar">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-16 border-b border-slate-200 pb-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-100">
              <FontAwesomeIcon icon={faDatabase} className="text-white text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                 <p className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600 leading-none">Security Protocol F01</p>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Intelligence <span className="text-indigo-600">Vault.</span></h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
             <FontAwesomeIcon icon={faHistory} className="text-indigo-600 text-[10px]" />
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{memories.length} Records Stored</span>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-10 mb-12 flex items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="mt-1 w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
            <FontAwesomeIcon icon={faShieldAlt} className="text-indigo-600 text-lg" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-3">Neural Privacy Standards</h4>
            <p className="text-lg text-indigo-900/80 font-medium leading-relaxed pr-10">
              Archived insights are used exclusively to maintain continuity within your AI sessions. You maintain absolute authority over your neural map—delete any record instantly.
            </p>
          </div>
        </motion.div>

        {memories.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm group">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
              <FontAwesomeIcon icon={faBrain} className="text-slate-300 group-hover:text-indigo-600 text-3xl transition-colors" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Vault Desynchronized</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg mb-10">
              Wrap an active mentor session to begin generating persistent long-term memories.
            </p>
            <button className="px-10 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95">
               Initialize Sync
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6 pb-24">
            <AnimatePresence>
              {memories.map((m, idx) => (
                <motion.div
                  key={m._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-slate-200 hover:border-indigo-100 p-8 rounded-[2.5rem] flex items-center justify-between group transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-50"
                >
                  <div className="flex items-center gap-8">
                    <div className={`w-3 h-3 rounded-full shadow-lg ${
                      m.type === 'goal' ? 'bg-emerald-500 shadow-emerald-100' : 
                      m.type === 'fact' ? 'bg-indigo-600 shadow-indigo-100' : 
                      'bg-purple-600 shadow-purple-100'
                    }`} />
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Classification: {m.type}
                        </span>
                        {m.confidence > 0.8 && (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                             <FontAwesomeIcon icon={faCheckCircle} className="text-[8px]" />
                             <span className="text-[8px] font-black uppercase tracking-widest leading-none pt-0.5">High Stability</span>
                          </div>
                        )}
                      </div>
                      <p className="text-lg text-slate-900 font-bold tracking-tight pr-6">{m.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(m._id)}
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all border border-transparent"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vault;
