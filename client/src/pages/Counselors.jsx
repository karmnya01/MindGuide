import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie, faArrowRight, faTimes, faChevronRight, faCompass, faHeartbeat, faWallet, faBrain, faGraduationCap, faUsers } from "@fortawesome/free-solid-svg-icons";

const counselors = [
  {
    type: "Academic Counselor",
    desc: "Expert guidance for educational planning and overcoming academic hurdles.",
    icon: faGraduationCap,
    color: "indigo",
    image: "https://img.freepik.com/free-vector/hand-drawn-speech-therapy-illustration_23-2149211795.jpg?w=1060&t=st=1701240171~exp=1701240771~hmac=7724e7522d1530150a446d7c781fc7bf01fcb98fd123df50ff5a3d9a6e5132a9",
  },
  {
    type: "Career Counselor",
    desc: "Discover your path, explore professions, and plan your career trajectory.",
    icon: faCompass,
    color: "blue",
    image: "https://cdn.vectorstock.com/i/1000x1000/75/62/psychotherapy-counseling-doctor-psychologist-vector-25617562.webp",
  },
  {
    type: "Personal Counselor",
    desc: "Navigate personal challenges, relationships, and self-discovery.",
    icon: faBrain,
    color: "purple",
    image: "https://img.freepik.com/free-vector/webinar-concept-illustration_114360-4874.jpg?w=740&t=st=1701239974~exp=1701240574~hmac=0113c9f934511efbd7fdec887780a1d0419b0c9daef878ededa42d54a722352a",
  },
  {
    type: "Financial Counselor",
    desc: "Learn to manage expenses, budget wisely, and plan for the future.",
    icon: faWallet,
    color: "emerald",
    image: "https://img.freepik.com/free-vector/webinar-concept-illustration_114360-4764.jpg?w=1060&t=st=1701240027~exp=1701240627~hmac=1834e3cae4356cabb9d2131497e0886a3087f2c1202571135610816574b114d7",
  },
  {
    type: "Health & Wellness",
    desc: "Holistic advice for maintaining physical and mental well-being.",
    icon: faHeartbeat,
    color: "rose",
    image: "https://img.freepik.com/free-vector/medical-worker-with-clipboard-waiting-patients_74855-7617.jpg?w=1380&t=st=1701240056~exp=1701240656~hmac=16eb398c823e4f8fd11c0abea654bba7166348188b9faf8868214bffc3257dc4",
  },
  {
    type: "Student Life Counselor",
    desc: "Guidance for extracurriculars, campus living, and student engagement.",
    icon: faUsers,
    color: "amber",
    image: "https://img.freepik.com/free-vector/hand-drawn-visit-psychologist-concept_52683-69070.jpg?w=996&t=st=1701240107~exp=1701240707~hmac=2263fc5eaa7dfbcbdf544e73f298064cf82f0e8d7ca0ded471712d03d37fa2f4",
  },
  {
    type: "Emotional Support",
    desc: "A safe space to process emotions, stress, and anxiety.",
    icon: faBrain,
    color: "violet",
    image: "https://img.freepik.com/free-vector/hand-drawn-visit-psychologist-concept_52683-69069.jpg?w=740&t=st=1701240136~exp=1701240736~hmac=da1f260b4eafd0ca44d15abbdac1ac8feec04af3fd94ebe9451dd8feb023d996",
  },
];

const Counselors = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const navigate = useNavigate();

  const handleCounselorClick = (counselor) => {
    setSelectedCounselor(counselor);
    setShowConfirmation(true);
  };

  const handleConfirmation = (confirmed) => {
    if (confirmed && selectedCounselor) {
      const typeStr = selectedCounselor.type.toLowerCase();
      const link = `/counselors/chat/${typeStr}`;
      navigate(link);
    }
    setShowConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 font-sans selection:bg-indigo-100 no-scrollbar">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-6 py-2 bg-white border border-slate-200 rounded-full shadow-sm mb-6">
             <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600">Executive Mentorship Suite</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
            Choose Your <span className="text-indigo-600">Mentor.</span>
          </h1>
          <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-lg font-medium">
            Select the specialization that aligns with your current strategic goals to begin a personalized neural growth session.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {counselors.map((counselor, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={index}
              onClick={() => handleCounselorClick(counselor)}
              className="group cursor-pointer bg-white border border-slate-200 rounded-[3rem] overflow-hidden hover:border-indigo-600 transition-all duration-500 flex flex-col hover:shadow-2xl hover:shadow-indigo-50"
            >
              <div className="h-56 overflow-hidden relative bg-slate-50">
                <img
                  src={counselor.image}
                  alt={counselor.type}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent group-hover:opacity-0 transition-opacity duration-700" />
                <div className="absolute top-6 left-6 w-14 h-14 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <FontAwesomeIcon icon={counselor.icon} className="text-xl" />
                </div>
              </div>
              <div className="p-10 flex-1 flex flex-col">
                <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {counselor.type}
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-1">
                  {counselor.desc}
                </p>
                <div className="mt-auto flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                  Initialize Protocol <FontAwesomeIcon icon={faArrowRight} className="ml-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showConfirmation && selectedCounselor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border border-slate-200 rounded-[3.5rem] p-12 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => handleConfirmation(false)}
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-8 mx-auto shadow-sm">
                <FontAwesomeIcon icon={selectedCounselor.icon} className="text-3xl" />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 text-center mb-3 tracking-tighter leading-none">Confirm Sync</h3>
              <p className="text-slate-500 text-center mb-10 font-medium text-lg">
                Begin a high-fidelity intelligence session with the <span className="text-indigo-600 font-black">{selectedCounselor.type}</span>?
              </p>
              
              <div className="flex flex-col gap-4">
                <button
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-6 rounded-2xl transition-all shadow-xl active:scale-95 text-[10px] uppercase tracking-widest"
                  onClick={() => handleConfirmation(true)}
                >
                  Confirm Neural Link
                </button>
                <button
                  className="w-full bg-white border border-slate-200 text-slate-400 font-black py-6 rounded-2xl transition-all hover:bg-slate-50 text-[10px] uppercase tracking-widest"
                  onClick={() => handleConfirmation(false)}
                >
                  Decline Transmission
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Counselors;
