import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faCheck, faCompass, faRocket, faTimes, faBookOpen, faStar, faPlay } from "@fortawesome/free-solid-svg-icons";

// ─── Level detail & Quiz modal ───────────────────────────────────────
const LevelModal = ({ trackId, level, onClose, onComplete, onTaskToggle }) => {
  const [quizMode, setQuizMode] = useState(false);
  const [localTasks, setLocalTasks] = useState(level?.tasks || []);
  const [questions, setQuestions] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");

  useEffect(() => {
    if (level) setLocalTasks(level.tasks || []);
  }, [level]);

  const toggleTask = async (taskIndex) => {
    const next = localTasks.map((t, i) =>
      i === taskIndex ? { ...t, done: !t.done } : t
    );
    setLocalTasks(next);
    try {
      await onTaskToggle(trackId, level.id, taskIndex, next[taskIndex].done);
    } catch (e) {
      setLocalTasks(level.tasks || []);
    }
  };

  if (!level) return null;

  const startQuiz = async () => {
    setLoadingQuiz(true);
    setQuizMode(true);
    setErrorStatus("");
    try {
      const { data } = await axios.post("/api/v1/journey/assessment", {
        trackId,
        levelId: level.id
      });
      if (data.success && data.data && data.data.length > 0) {
        setQuestions(data.data);
      } else {
        setErrorStatus("Could not load quiz questions.");
      }
    } catch (e) {
      setErrorStatus("Failed to contact assessment server.");
    }
    setLoadingQuiz(false);
  };

  const handleNextQ = () => {
    if (selectedOpt === questions[currentQ].correctIndex) {
      setScore(s => s + 1);
    }
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOpt(null);
    } else {
      finishQuiz(selectedOpt === questions[currentQ].correctIndex ? score + 1 : score);
    }
  };

  const finishQuiz = async (finalScore) => {
    setQuizFinished(true);
    setCompleting(true);
    const passed = finalScore >= Math.ceil(questions.length * 0.6); // 60% pass rate
    try {
      await onComplete(trackId, level.id, passed);
    } catch (e) {
      console.error(e);
    }
    setCompleting(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-10 pt-10 pb-6 border-b border-slate-100 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-600">Level {level.order + 1}</p>
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tighter">{level.title}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="px-10 py-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
            {!quizMode ? (
              <>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">{level.description}</p>
                {localTasks.length > 0 && (
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Step todos</p>
                    <ul className="space-y-3">
                      {localTasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTask(i)}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              task.done
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-200 hover:border-indigo-400"
                            }`}
                          >
                            {task.done && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                          </button>
                          <span
                            className={`text-[14px] font-medium leading-snug ${
                              task.done ? "text-slate-400 line-through" : "text-slate-800"
                            }`}
                          >
                            {task.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {level.resources && level.resources.length > 0 && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Neural Resources</p>
                    <ul className="space-y-4">
                      {level.resources.map((r, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={faPlay} className="text-indigo-600 text-[10px]" />
                          </div>
                          <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-slate-900 hover:text-indigo-600 font-black tracking-tight leading-tight transition-colors">
                            {r.title || r.link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center gap-3 px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl w-fit">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Protocol Reward</span>
                  <span className="text-lg font-black text-indigo-700 tracking-tighter">+{level.xpReward} XP</span>
                </div>
              </>
            ) : (
              <div className="min-h-[220px]">
                {loadingQuiz && (
                  <div className="flex flex-col items-center justify-center h-48 space-y-5">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Initializing Assessment...</p>
                  </div>
                )}
                {errorStatus && (
                  <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center">
                    <p className="text-rose-600 text-sm font-bold">{errorStatus}</p>
                    <button onClick={() => setQuizMode(false)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 underline">Abort Mission</button>
                  </div>
                )}
                {!loadingQuiz && !quizFinished && questions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-8">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentQ + 1} / {questions.length}</p>
                      <div className="flex gap-1.5">
                        {questions.map((_, i) => (
                          <div key={i} className={`h-1 w-6 rounded-full ${i <= currentQ ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                        ))}
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-8 leading-tight tracking-tight">{questions[currentQ].question}</h3>
                    <div className="space-y-4">
                      {questions[currentQ].options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedOpt(idx)}
                          className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-200 font-bold ${selectedOpt === idx
                              ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100 text-slate-900 translate-x-2'
                              : 'border-slate-100 bg-white text-slate-500 hover:border-indigo-100'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={selectedOpt === null}
                      onClick={handleNextQ}
                      className="mt-10 w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-30 transition-all shadow-xl text-[10px] uppercase tracking-[0.2em]"
                    >
                      {currentQ === questions.length - 1 ? "Complete Verification" : "Advance Interaction"}
                    </button>
                  </motion.div>
                )}
                {quizFinished && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] flex items-center justify-center bg-slate-50 border border-slate-100 shadow-sm text-4xl">
                      {score >= Math.ceil(questions.length * 0.6) ? "🏆" : "💠"}
                    </div>
                    <h3 className="text-3xl font-black mb-2 text-slate-900 tracking-tighter">Assessment Result</h3>
                    <p className="text-slate-500 mb-10 font-medium">Neural score: <span className="text-indigo-600 font-black">{score} / {questions.length}</span></p>

                    {score >= Math.ceil(questions.length * 0.6) ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem]">
                        <p className="text-emerald-600 font-black uppercase text-[10px] tracking-widest mb-2">Protocol Verified</p>
                        <p className="text-emerald-700 font-black text-2xl tracking-tighter">Level Advanced</p>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem]">
                        <p className="text-rose-600 font-black uppercase text-[10px] tracking-widest mb-2">Sync Refinement Required</p>
                        <p className="text-rose-700 font-black text-2xl tracking-tighter">Retrying Signal...</p>
                      </div>
                    )}
                    <button onClick={onClose} className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-xl">
                      Return to Map
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {!quizMode && (
            <div className="px-10 pb-10 pt-4">
              {level.status === "completed" ? (
                <div className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-[10px] uppercase tracking-widest w-full">
                  <FontAwesomeIcon icon={faCheck} /> Protocol Completed
                </div>
              ) : level.status === "unlocked" ? (
                <button onClick={startQuiz} className="w-full py-6 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95">
                  Verify Knowledge Link
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest w-full">
                  <FontAwesomeIcon icon={faLock} /> Neural Lock Active
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const CreateJourneyModal = ({ open, onClose, onSuccess }) => {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!goal) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/v1/journey", { goal });
      if (data.success) {
        onSuccess(data.data);
        onClose();
      }
    } catch (err) {
      console.error("Failed to architect journey", err);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] w-full max-w-xl p-12 shadow-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Architect <span className="text-indigo-600">Growth.</span></h2>
            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 transition-all flex items-center justify-center">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
            Provide your primary objective. Our neural engine will architect a 5-step strategic path to master this domain.
          </p>

          <div className="space-y-6">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ex: Advanced Distributed Systems Architecture"
              className="w-full bg-slate-50 border border-slate-100 px-8 py-6 rounded-2xl text-[15px] font-bold text-slate-900 placeholder-slate-300 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
            />
            <button
              onClick={handleCreate}
              disabled={loading || !goal}
              className="w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-100 text-[10px] uppercase tracking-[0.3em] disabled:opacity-30"
            >
              {loading ? "Initializing Protocol..." : "Finalize Blueprint"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const NODE_R = 30;
const NODE_GAP = 160;
const SVG_H = 220;
const CY = SVG_H / 2;

const JourneyMap = () => {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrackId, setSelectedTrack] = useState(null);
  const [selectedLevel, setSelected] = useState(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchJourney = () => {
    setLoading(true);
    axios.get("/api/v1/journey")
      .then(({ data }) => {
        if (data.success) setJourney(data.data);
        setError(null);
      })
      .catch(() => setError("Failed to load neural map."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJourney(); }, []);

  const handleTaskToggle = async (trackId, levelId, taskIndex, done) => {
    const { data } = await axios.patch("/api/v1/journey/tasks", {
      trackId,
      levelId,
      taskIndex,
      done,
    });
    if (data.success) {
      setJourney(data.data);
      if (selectedLevel?.id === levelId) {
        const track = data.data.tracks.find((t) => t.id === trackId);
        const lvl = track?.levels.find((l) => l.id === levelId);
        if (lvl) setSelected(lvl);
      }
    }
  };

  const handleComplete = async (trackId, levelId, passed) => {
    try {
      const { data } = await axios.patch("/api/v1/journey/progress", {
        trackId,
        levelId,
        passed
      });
      if (data.success) {
        if (passed) {
          setJourney(data.data.journey);
        } else {
          setJourney(prev => ({ ...prev, totalXP: Math.max(0, prev.totalXP - 10) }));
        }
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError(e.response?.data?.error || "Signal update failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Synchronizing Neural Tracks...</p>
      </div>
    );
  }

  if (!journey || !journey.tracks || journey.tracks.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center border border-slate-200 shadow-sm mb-10 text-4xl">
          🧭
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter leading-none">No Active Tracks</h2>
        <p className="text-lg text-slate-500 max-w-sm mx-auto font-medium leading-relaxed mb-10">
          You haven't initiated any neural journey maps yet. Connect with a mentor to architect your first growth path.
        </p>
        <button onClick={() => setCreateModalOpen(true)} className="px-12 py-5 rounded-2xl font-black bg-indigo-600 hover:bg-slate-900 text-white transition-all shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-widest active:scale-95">
          Architect New Path
        </button>
        <CreateJourneyModal 
          open={isCreateModalOpen} 
          onClose={() => setCreateModalOpen(false)} 
          onSuccess={(newJourney) => {
            setJourney(newJourney);
            setCreateModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 no-scrollbar">
      <div className="p-8 md:p-12">
        <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 border-b border-slate-200 pb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                <FontAwesomeIcon icon={faCompass} className="text-white text-sm" />
              </div>
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600">Evolution Map Unit</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Journey <span className="text-indigo-600">Interface.</span></h1>
          </div>
          <div className="flex items-center gap-6 bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex flex-col pr-8 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accumulated Potency</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{journey.totalXP} <span className="text-xs text-indigo-600">XP</span></p>
            </div>
            <button onClick={() => setCreateModalOpen(true)} className="bg-slate-900 hover:bg-indigo-600 text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg text-[10px] uppercase tracking-widest active:scale-90">
              + New Track
            </button>
          </div>
        </header>

        {error && (
          <div className="max-w-7xl mx-auto mb-10 px-8 py-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest flex items-center gap-4 relative">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-900 transition-colors">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-12 pb-24">
          {journey.tracks.map((track) => {
            const renderLevels = [...track.levels, { id: 'continue', isContinueNode: true }];
            const totalW = Math.max(renderLevels.length * NODE_GAP + 200, 1000);
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                key={track.id}
                className="bg-white border border-slate-200 rounded-[3.5rem] p-10 md:p-14 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-700 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-5 mb-12 relative z-10">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <FontAwesomeIcon icon={faRocket} className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Protocol Track ID: {track.id.toString().slice(-8)}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{track.title}</h3>
                  </div>
                </div>

                <div className="overflow-x-auto pb-10 no-scrollbar cursor-grab active:cursor-grabbing relative z-10" style={{ WebkitOverflowScrolling: "touch" }}>
                  <svg width={totalW} height={SVG_H} className="block select-none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Connections */}
                    {renderLevels.map((level, i) => {
                      if (i === renderLevels.length - 1) return null;
                      const x1 = 100 + i * NODE_GAP + NODE_R;
                      const x2 = 100 + (i + 1) * NODE_GAP - NODE_R;
                      const isDone = level.status === "completed" || level.isContinueNode;
                      return (
                        <path key={`path-${i}`} d={`M ${x1} ${CY} C ${x1 + 45} ${CY}, ${x2 - 45} ${CY}, ${x2} ${CY}`}
                          fill="none" stroke={isDone ? "url(#lineGrad)" : "#F1F5F9"} strokeWidth={isDone ? 6 : 4} strokeDasharray={isDone ? "none" : "8 8"}
                          filter={isDone ? "url(#glow)" : "none"}
                        />
                      );
                    })}

                    {/* Nodes */}
                    {renderLevels.map((level, i) => {
                      const cx = 100 + i * NODE_GAP;
                      if (level.isContinueNode) {
                        return (
                          <g key="continue" style={{ cursor: "pointer" }}
                            onClick={async () => {
                              try {
                                const { data } = await axios.post("/api/v1/journey/continue", { trackId: track.id });
                                if (data.success) fetchJourney();
                              } catch (e) {
                                setError("Generation signal lost.");
                              }
                            }}
                            className="group"
                          >
                            <circle cx={cx} cy={CY} r={NODE_R + 10} fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 6" opacity={0.4} className="animate-[spin_8s_linear_infinite]" />
                            <circle cx={cx} cy={CY} r={NODE_R} fill="#F8FAFC" stroke="#6366f1" strokeWidth={3} className="group-hover:fill-indigo-600 group-hover:stroke-indigo-700 transition-all duration-300 shadow-xl" />
                            <foreignObject x={cx - 12} y={CY - 12} width={24} height={24}>
                              <div xmlns="http://www.w3.org/1999/xhtml" className="text-indigo-600 group-hover:text-white flex items-center justify-center h-full w-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></svg>
                              </div>
                            </foreignObject>
                            <foreignObject x={cx - 70} y={CY + NODE_R + 15} width={140} height={40}>
                              <div xmlns="http://www.w3.org/1999/xhtml" className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-indigo-600 leading-none">
                                Extend Map
                              </div>
                            </foreignObject>
                          </g>
                        );
                      }

                      const isLocked = level.status === "locked";
                      const isCompleted = level.status === "completed";
                      const isUnlocked = level.status === "unlocked";

                      const ringColor = isCompleted ? "#6366f1" : isUnlocked ? "#94a3b8" : "#E2E8F0";
                      const fillColor = isCompleted ? "#EEF2FF" : isUnlocked ? "white" : "#F8FAFC";
                      const strokeWidth = isCompleted ? 5 : isUnlocked ? 3 : 2;
                      const opacity = isLocked ? 0.6 : 1;

                      return (
                        <g key={level.id} style={{ cursor: isLocked ? "default" : "pointer", opacity }}
                          onClick={() => !isLocked && (setSelectedTrack(track.id), setSelected(level))}
                          className={!isLocked ? "hover:opacity-90 transition-all duration-300 group" : ""}
                        >
                          {isCompleted && <circle cx={cx} cy={CY} r={NODE_R + 8} fill="none" stroke="#6366f1" strokeWidth={2} opacity={0.3} filter="url(#glow)" className="animate-pulse" />}
                          {isUnlocked && !isCompleted && <circle cx={cx} cy={CY} r={NODE_R + 8} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite]" opacity={0.5} />}

                          <circle cx={cx} cy={CY} r={NODE_R} fill={fillColor} stroke={ringColor} strokeWidth={strokeWidth}
                            className="group-hover:stroke-indigo-600 transition-all duration-300 shadow-sm" />

                          <foreignObject x={cx - 12} y={CY - 12} width={24} height={24}>
                            <div xmlns="http://www.w3.org/1999/xhtml" className={`flex justify-center items-center h-full transition-colors ${isCompleted ? "text-indigo-600" : isUnlocked ? "text-slate-900 font-black" : "text-slate-300"}`} style={{ fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                              {isCompleted ? <FontAwesomeIcon icon={faCheck} /> : isLocked ? <FontAwesomeIcon icon={faLock} /> : i + 1}
                            </div>
                          </foreignObject>

                          <foreignObject x={cx - 70} y={CY + NODE_R + 15} width={140} height={50}>
                            <div xmlns="http://www.w3.org/1999/xhtml" className={`text-[11px] leading-tight text-center font-black uppercase tracking-widest px-2 overflow-hidden transition-colors ${isLocked ? "text-slate-300" : "text-slate-900 group-hover:text-indigo-600"}`} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontFamily: "Inter, sans-serif" }}>
                              {level.title}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </motion.div>
            );
          })}
        </div>

        {selectedLevel && (
          <LevelModal
            trackId={selectedTrackId}
            level={selectedLevel}
            onClose={() => { setSelected(null); setSelectedTrack(null); fetchJourney(); }}
            onComplete={handleComplete}
            onTaskToggle={handleTaskToggle}
          />
        )}

        <CreateJourneyModal
          open={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(newJourney) => {
            setJourney(newJourney);
            setCreateModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default JourneyMap;
