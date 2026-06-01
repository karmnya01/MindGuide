import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faChartLine, faCompass, faArrowRight, faEnvelope, faUser, faPaperPlane, faRocket, faShieldAlt, faMicrochip, faTachometerAlt } from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.mindGuide.userInfo);

  return (
    <div className="bg-[#F8FAFC] text-slate-900 font-sans overflow-x-hidden w-full selection:bg-indigo-100 no-scrollbar">



      {/* ─── RADIANT HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-40 pb-24 px-8 overflow-hidden">
        {/* Superior Ambient Light */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[180px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[180px] pointer-events-none"></div>

        <div className="z-10 max-w-7xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 px-6 py-2 bg-white border border-slate-200 rounded-full shadow-sm"
          >
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Intelligence Protocol v4.2 Active</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-9xl lg:text-[11rem] font-black tracking-tighter mb-10 leading-[0.85] text-slate-900"
          >
            NEURAL <br /> <span className="text-indigo-600">EVOLUTION.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-slate-500 max-w-3xl mb-16 leading-tight font-medium"
          >
            AI-architected career roadmaps and elite emotional intelligence mentoring. Precision tools for high-performance leadership.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 items-center"
          >
            <button
              className="group relative bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-5 rounded-[1.5rem] transition-all hover:scale-105 shadow-xl shadow-indigo-100 flex items-center gap-4 active:scale-95"
              onClick={() => navigate("/register")}
            >
              <span className="uppercase tracking-[0.2em] text-xs">Initialize Path</span>
              <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="px-12 py-5 rounded-[1.5rem] bg-white border border-slate-200 hover:border-indigo-100 text-slate-900 font-black transition-all active:scale-95 uppercase tracking-[0.2em] text-xs shadow-sm"
              onClick={() => navigate("/tools")}
            >
              Core Tools
            </button>
          </motion.div>
        </div>

        {/* Improved Dashboard Hub Preview */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          className="w-full max-w-6xl mx-auto mt-32 h-[35rem] rounded-t-[4rem] border border-slate-200 bg-white/40 backdrop-blur-3xl relative overflow-hidden flex shadow-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-600/30 to-transparent"></div>

          <div className="flex-1 p-12 flex flex-col gap-10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <FontAwesomeIcon icon={faBrain} className="text-indigo-600 text-xl" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Live Neural Sync</p>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Career Synthesis Model</h4>
                </div>
              </div>
              <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest font-mono">
                Stabilized 99.8%
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="max-w-[80%] bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] rounded-tl-sm shadow-sm">
                <p className="text-lg text-indigo-900 font-medium leading-relaxed italic">"Architect a 6-month progression roadmap for my transition into AI Robotics."</p>
              </div>
              <div className="self-end max-w-[80%] bg-white border border-slate-200 p-8 rounded-[2rem] rounded-tr-sm shadow-sm">
                <p className="text-lg text-slate-700 font-medium leading-relaxed">"Processing domain intersection... Generating Multi-Track Roadmap. Initializing Phase 1: Mechatronic Intelligence Foundations. I recommend focusing on ROS2 and Kinematics first."</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── MISSION DIRECTIVE ──────────────────────────────────────────────────── */}
      <section id="about" className="relative py-48 px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="absolute -inset-20 bg-indigo-500/5 blur-[120px] rounded-full"></div>
            <div className="relative bg-[#F1F5F9] rounded-[4rem] p-4 border border-slate-200 overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1573495804664-b1c0849525af?q=80&w=2069"
                alt="Mentorship"
                className="w-full aspect-[4/5] object-cover rounded-[3rem] group-hover:scale-105 transition-all duration-1000 shadow-xl"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-full lg:w-1/2"
          >
            <p className="text-[11px] font-black tracking-[0.4em] uppercase text-indigo-600 mb-6 font-display">Mission Core Layer</p>
            <h3 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter mb-12 leading-[0.9] font-display">
              EMPOWERING <br /> <span className="text-indigo-600">NEURAL PATHS.</span>
            </h3>
            <div className="space-y-10 text-xl text-slate-600 font-medium leading-relaxed">
              <p>
                Mind-Guide is a professional-first intelligence platform bridging the gap between raw potential and executive performance. We provide the infrastructure for deep career synthesis and emotional resilience.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <FontAwesomeIcon icon={faMicrochip} className="text-indigo-600 mb-6 text-2xl" />
                  <h5 className="text-slate-900 font-black text-[10px] tracking-widest uppercase mb-4">Precision Engine</h5>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">Tailored insights and behavioral roadmaps designed for high-stakes career navigation.</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-indigo-600 mb-6 text-2xl" />
                  <h5 className="text-slate-900 font-black text-[10px] tracking-widest uppercase mb-4">Integrity Mesh</h5>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">Biometric-style wellness monitoring to prevent burnout in high-performance environments.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── EXECUTION SUITE ──────────────────────────────────────────────────── */}
      <section id="services" className="py-48 px-8 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto text-center mb-32">
          <p className="text-[11px] font-black tracking-[0.4em] uppercase text-indigo-600 mb-6">Protocol Hub</p>
          <h3 className="text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] font-display">INTELLIGENT <br /> EXECUTION.</h3>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              title: "Career Architect",
              icon: faCompass,
              image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1864",
              desc: "Deep analysis of your neural profile to architect long-term, high-value career maneuvers."
            },
            {
              title: "Sentiment Pulse",
              icon: faBrain,
              image: "https://img.freepik.com/free-photo/collage-customer-experience-concept_23-2149367121.jpg",
              desc: "Real-time emotional load monitoring to ensure your mental resilience stays at executive levels."
            },
            {
              title: "Dynamic Roadmaps",
              icon: faChartLine,
              image: "https://images.unsplash.com/photo-1506784881475-0e408bbca849?q=80&w=2068",
              desc: "Multi-track progression systems that adapt instantly to market shifts and personal evolution."
            }
          ].map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white rounded-[3rem] p-10 group overflow-hidden border border-slate-200 transition-all duration-700 flex flex-col hover:shadow-2xl hover:shadow-indigo-100"
            >
              <div className="h-64 mb-10 overflow-hidden relative rounded-[2.5rem]">
                <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent group-hover:opacity-0 transition-opacity" />
                <div className="absolute bottom-6 left-6 w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-indigo-600 transition-colors">
                  <FontAwesomeIcon icon={service.icon} className="text-white text-xl" />
                </div>
              </div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-6 leading-none">{service.title}</h4>
              <p className="text-slate-500 font-medium leading-relaxed italic pr-4">"{service.desc}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CONTACT SECTION ───────────────────────────────────────────────────── */}
      <section id="contact" className="py-48 px-8 bg-white">
        <div className="max-w-7xl mx-auto bg-slate-50 rounded-[4rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-5/12 p-16 border-b lg:border-b-0 lg:border-r border-slate-200">
              <p className="text-[11px] font-black tracking-[0.4em] uppercase text-indigo-600 mb-8">Communications</p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-10 leading-[0.9]">INITIALIZE <br /> CONNECTION.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-16">
                Access our global support layer for any protocol-related inquiries or technical coordination.
              </p>

              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                  <FontAwesomeIcon icon={faEnvelope} className="text-indigo-600 text-xl" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Protocol Command</p>
                  <p className="text-slate-900 font-black tracking-tight">ops@mindguide.ai</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-7/12 p-16 bg-white">
              <form className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
                      placeholder="Target Email"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Transmission</label>
                  <textarea
                    rows="4"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium resize-none"
                    placeholder="Brief Transmission Content"
                  ></textarea>
                </div>

                <button
                  className="group bg-slate-900 text-white font-black py-6 rounded-[2rem] transition-all hover:bg-indigo-600 flex items-center justify-center gap-4 active:scale-95 uppercase tracking-[0.3em] text-[10px] shadow-xl"
                >
                  Send Transmission
                  <FontAwesomeIcon icon={faPaperPlane} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="text-white font-black text-xs">MG</span>
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900">MIND-GUIDE INTEL.</span>
          </div>
          <div className="flex gap-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy Protocol</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry V2.0</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2026 Mind-Guide AI</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
