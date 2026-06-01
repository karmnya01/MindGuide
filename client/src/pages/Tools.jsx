import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWaveSquare, faBrain, faChartBar, faExclamationCircle, faMicrophone, faRobot, faArrowRight, faShieldAlt } from "@fortawesome/free-solid-svg-icons";

const QUESTIONS = [
  { id: 1, text: "I enjoy trying new things.", trait: "openness" },
  { id: 2, text: "I am very organized.", trait: "conscientiousness" },
  { id: 3, text: "I feel energized around people.", trait: "extraversion" },
  { id: 4, text: "I care about others' feelings.", trait: "agreeableness" },
  { id: 5, text: "I get stressed easily.", trait: "neuroticism" },
  { id: 6, text: "I enjoy creative activities.", trait: "openness" },
  { id: 7, text: "I finish tasks on time.", trait: "conscientiousness" },
  { id: 8, text: "I like social gatherings.", trait: "extraversion" },
  { id: 9, text: "I avoid conflicts.", trait: "agreeableness" },
  { id: 10, text: "I often worry about things.", trait: "neuroticism" },
];

const TRAIT_LABELS = {
  openness: "Openness to Experience",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  neuroticism: "Neuroticism",
};

const TRAIT_COLORS = {
  openness: "from-blue-500 to-indigo-600",
  conscientiousness: "from-emerald-500 to-teal-600",
  extraversion: "from-amber-500 to-orange-600",
  agreeableness: "from-rose-500 to-pink-600",
  neuroticism: "from-purple-500 to-fuchsia-600",
};

function calculatePersonality(answers) {
  const scores = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
  const counts = { ...scores };
  answers.forEach((ans) => {
    scores[ans.trait] += ans.value;
    counts[ans.trait] += 1;
  });
  Object.keys(scores).forEach((trait) => {
    scores[trait] = counts[trait] ? scores[trait] / counts[trait] : 0;
  });
  return scores;
}

const Tools = () => {
  const [toneInput, setToneInput] = useState("");
  const [personalityAnswers, setPersonalityAnswers] = useState({});
  const [toneResult, setToneResult] = useState(null);
  const [personalityResult, setPersonalityResult] = useState(null);
  const [toneLoading, setToneLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyzeTone = async () => {
    if (!toneInput.trim()) return;
    setToneLoading(true);
    setError("");
    try {
      const response = await axios.post("/api/v1/chat/analyze-tone", { text: toneInput.trim() });
      setToneResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze tone. Please check your connection.");
    } finally {
      setToneLoading(false);
    }
  };

  const handlePersonalityChange = (id, value, trait) => {
    setPersonalityAnswers((prev) => ({ ...prev, [id]: { value: Number(value), trait } }));
  };

  const handleAnalyzePersonality = () => {
    const answers = Object.values(personalityAnswers);
    if (answers.length !== QUESTIONS.length) {
      setError("Please answer all personality questions.");
      return;
    }
    setError("");
    setPersonalityResult(calculatePersonality(answers));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 font-sans selection:bg-indigo-100 no-scrollbar">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-20">
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-6 py-2 bg-white border border-slate-200 rounded-full shadow-sm mb-6">
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600">Intelligence Matrix Alpha</span>
           </motion.div>
           <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
             Analysis & <span className="text-indigo-600">Assessment.</span>
           </h1>
           <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
             Leverage AI-driven neuro-analytics to understand your emotional tone and discover deep insights into your core personality traits.
           </p>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-10 bg-rose-50 border border-rose-100 text-rose-600 px-8 py-5 rounded-3xl flex items-center gap-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-xl" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Tone Analyzer Card */}
          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm flex flex-col group hover:shadow-xl hover:shadow-indigo-50 transition-all duration-500">
             <div className="h-56 relative overflow-hidden bg-slate-900">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                <div className="absolute bottom-8 left-8 flex items-center gap-5 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl">
                    <FontAwesomeIcon icon={faWaveSquare} className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Tone Analyzer</h2>
                    <p className="text-indigo-400 text-xs font-black uppercase tracking-widest leading-none mt-1">Sentiment Depth Engine</p>
                  </div>
                </div>
             </div>
             
             <div className="p-10 flex-1 flex flex-col">
                <textarea
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all min-h-[180px] resize-none mb-8 shadow-inner font-medium text-[15px]"
                  placeholder="Paste or type text here to detect its underlying emotional architecture..."
                  value={toneInput}
                  onChange={(e) => setToneInput(e.target.value)}
                />
                
                <button
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest"
                  onClick={handleAnalyzeTone}
                  disabled={toneLoading || !toneInput.trim()}
                >
                  {toneLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing Neural Load...</>
                  ) : (
                    <>Analyze Transmission <FontAwesomeIcon icon={faArrowRight} /></>
                  )}
                </button>

                <AnimatePresence>
                  {toneResult && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-10 overflow-hidden">
                      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Primary Neural Tone</span>
                          <span className="text-lg font-black text-white px-5 py-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                            {toneResult.topLabel || "Neutral"}
                          </span>
                        </div>
                        
                        {toneResult.analysis && toneResult.analysis.length > 0 ? (
                           <div className="space-y-6">
                             {toneResult.analysis.slice(0, 5).map((item) => (
                               <div key={item.label}>
                                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                   <span className="text-slate-600">{item.label}</span>
                                   <span className="text-indigo-600">{(item.score * 100).toFixed(1)}%</span>
                                 </div>
                                 <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                   <motion.div initial={{ width: 0 }} animate={{ width: `${item.score * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} className="bg-indigo-600 h-full rounded-full" />
                                 </div>
                                </div>
                             ))}
                           </div>
                        ) : (
                           <p className="text-slate-400 text-xs font-bold text-center italic">Insufficient data for breakdown.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* Personality Card */}
          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm flex flex-col group hover:shadow-xl hover:shadow-purple-50 transition-all duration-500">
             <div className="h-56 relative overflow-hidden bg-slate-900">
                <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                <div className="absolute bottom-8 left-8 flex items-center gap-5 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-2xl">
                    <FontAwesomeIcon icon={faBrain} className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Identity Matrix</h2>
                    <p className="text-purple-400 text-xs font-black uppercase tracking-widest leading-none mt-1">OCEAN Trait Profiling</p>
                  </div>
                </div>
             </div>
             
             <div className="p-10 flex-1 flex flex-col">
                <div className="flex-1 max-h-[460px] overflow-y-auto pr-4 space-y-6 custom-scrollbar mb-8 no-scrollbar">
                  {QUESTIONS.map((q, i) => (
                    <div key={q.id} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 hover:border-purple-200 transition-all">
                      <p className="text-slate-900 font-bold mb-5 flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm shrink-0">{i + 1}</span> 
                        {q.text}
                      </p>
                      
                      <div className="relative">
                        <select
                          className="w-full appearance-none bg-white border border-slate-200 text-slate-700 rounded-xl px-6 py-4 focus:outline-none focus:border-purple-600 transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-sm hover:border-purple-200"
                          value={personalityAnswers[q.id]?.value || ""}
                          onChange={(e) => handlePersonalityChange(q.id, e.target.value, q.trait)}
                        >
                          <option value="" disabled>Coordinate Input...</option>
                          <option value={1}>1 - Strongly Disagree</option>
                          <option value={2}>2 - Disagree</option>
                          <option value={3}>3 - Neutral</option>
                          <option value={4}>4 - Agree</option>
                          <option value={5}>5 - Strongly Agree</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  className="w-full bg-slate-900 hover:bg-purple-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-[10px] uppercase tracking-widest"
                  onClick={handleAnalyzePersonality}
                >
                  Generate Behavior Report
                </button>

                <AnimatePresence>
                  {personalityResult && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-10 overflow-hidden">
                      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                           <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Neural Profiling Results</span>
                           <FontAwesomeIcon icon={faChartBar} className="text-purple-600" />
                        </div>
                        
                        <div className="space-y-6">
                          {Object.entries(personalityResult).map(([trait, value]) => {
                            const percent = ((value - 1) / 4) * 100;
                            return (
                              <div key={trait}>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                  <span className="text-slate-600">{TRAIT_LABELS[trait]}</span>
                                  <span className="text-purple-600">{percent.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut" }} className="bg-purple-600 h-full rounded-full" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
