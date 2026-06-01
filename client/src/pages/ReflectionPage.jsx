import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faBrain, faRocket, faCalendarAlt, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const ReflectionPage = () => {
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = useSelector((state) => state.mindGuide.userInfo);

  useEffect(() => {
    const fetchReflections = async () => {
      try {
        const { data } = await axios.get("/api/v1/user/reflections");
        if (data.success) setReflections(data.data);
      } catch (err) {
        console.error("Failed to fetch reflections", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReflections();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 md:px-12 no-scrollbar font-sans selection:bg-indigo-100">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 border-b border-slate-200 pb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                <FontAwesomeIcon icon={faBookOpen} className="text-white text-sm" />
             </div>
             <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600">Intelligence Evolution</span>
          </motion.div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
            Identity <span className="text-indigo-600">Archive.</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
            Your chronological progress engine. Review AI-synthesized behavioral shifts and core identity maturation from your mentor sessions.
          </p>
        </header>

        {reflections.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[3rem] p-24 text-center flex flex-col items-center shadow-sm"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-10 border border-slate-100 text-slate-300">
               <FontAwesomeIcon icon={faBrain} className="text-4xl" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Archival Matrix Empty</h3>
            <p className="text-slate-500 max-w-md mx-auto font-medium text-lg leading-relaxed mb-10">
               Complete and "Wrap" chat sessions with your AI mentors to begin generating your neural growth history.
            </p>
            <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">
               Initialize Session
            </button>
          </motion.div>
        ) : (
          <div className="space-y-12 relative">
            {/* Professional Timeline Spine */}
            <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-200 hidden md:block"></div>

            {reflections.map((ref, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1 }}
                key={ref._id}
                className="relative md:pl-28"
              >
                {/* Timeline Node */}
                <div className="absolute left-[34px] top-12 w-3.5 h-3.5 bg-white border-4 border-indigo-600 rounded-full hidden md:block z-10 shadow-sm shadow-indigo-100"></div>
                
                <div className="bg-white border border-slate-200 hover:border-indigo-200 transition-all duration-500 rounded-[3rem] p-12 group relative shadow-sm hover:shadow-xl hover:shadow-indigo-50">
                  {/* Decorative corner glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-12 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                         <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-indigo-600 text-[10px]" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                               {new Date(ref.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                         </div>
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none font-display group-hover:text-indigo-600 transition-colors">Session Synthesis</h3>
                    </div>
                    
                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                      <span className="text-4xl">{ref.moodSnapshot?.emotion === 'Anxious' ? '😟' : ref.moodSnapshot?.emotion === 'Confident' ? '✨' : '🧘'}</span>
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Neural Vibe</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight leading-none">{ref.moodSnapshot?.emotion || 'Balanced'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mb-12 pl-4">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-100 rounded-full" />
                     <p className="text-xl text-slate-600 font-medium leading-relaxed italic pr-6 pb-2">
                        "{ref.content}"
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] hover:bg-white hover:border-indigo-100 transition-all group/card shadow-sm">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none pt-0.5">Primary Insight</p>
                      </div>
                      <p className="text-slate-700 font-bold leading-relaxed">{ref.keyTakeaway}</p>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] hover:bg-white hover:border-emerald-100 transition-all group/card shadow-sm">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none pt-0.5">Action Vector</p>
                      </div>
                      <p className="text-slate-700 font-bold leading-relaxed">{ref.growthArea}</p>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
                     <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                        Expand Matrix Analysis
                        <FontAwesomeIcon icon={faChevronRight} className="text-[8px]" />
                     </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReflectionPage;
