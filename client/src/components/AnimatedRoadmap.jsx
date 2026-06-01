import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapSigns, faLink } from "@fortawesome/free-solid-svg-icons";

const AnimatedRoadmap = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-rose-400 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 text-sm">Invalid roadmap data provided.</p>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <FontAwesomeIcon icon={faMapSigns} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Your Custom Roadmap
        </h3>
      </div>
      
      <div className="relative border-l-2 border-indigo-500/40 ml-4 md:ml-6 mt-4">
        {data.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
            className="mb-8 ml-8 relative group"
          >
            {/* Animated dot on the timeline */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.15 + 0.2, type: "spring" }}
              className="absolute -left-[41px] mt-1.5 w-5 h-5 bg-[#0B0F19] rounded-full border-[3px] border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] flex items-center justify-center z-10 transition-transform group-hover:scale-125"
            >
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            </motion.div>

            <div className="bg-[#111827]/80 hover:bg-[#111827] transition-all duration-300 p-5 md:p-6 rounded-2xl shadow-lg border border-slate-700/50 group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/10 w-full overflow-hidden relative">
              
              {/* Optional: Add a subtle glow inside the card on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 transition-all duration-500 pointer-events-none"></div>

              <h4 className="text-lg font-bold text-white mb-3 flex items-start gap-3 break-words leading-tight">
                <span className="bg-indigo-600 text-white py-1 px-2.5 rounded-lg text-xs tracking-wider uppercase font-extrabold shadow-md shrink-0">
                  Step {index + 1}
                </span>
                <span className="mt-0.5">{step.title}</span>
              </h4>
              
              <p className="text-slate-400 text-[15px] mb-5 leading-relaxed break-words whitespace-pre-wrap">
                {step.description}
              </p>

              {step.resources && step.resources.length > 0 && (
                <div className="mt-4 bg-[#0B0F19]/80 p-4 rounded-xl border border-slate-700/60">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLink} className="text-emerald-400" />
                    Recommended Resources
                  </h5>
                  <ul className="flex flex-col gap-2.5">
                    {step.resources.map((res, rIndex) => (
                      <li key={rIndex}>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[14px] text-indigo-400 hover:text-indigo-300 flex items-start gap-2.5 group/link transition-all break-all font-medium"
                        >
                          <span className="w-1.5 h-1.5 bg-indigo-500/50 group-hover/link:bg-indigo-400 rounded-full inline-block mt-2 shrink-0 transition-colors"></span>
                          <span className="group-hover/link:underline underline-offset-2">{res.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* F03: Goal Commitment Button */}
              <button
                onClick={async () => {
                  try {
                    const deadline = new Date();
                    deadline.setDate(deadline.getDate() + 7); // Default 7 day deadline
                    const response = await fetch("http://localhost:3005/api/v1/contracts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        goalId: `${index}`,
                        title: step.title,
                        deadline: deadline.toISOString(),
                        commitmentLevel: "firm"
                      })
                    });
                    if (response.ok) {
                      alert("Committed! Contract created.");
                    }
                  } catch (err) {
                    console.error("Commitment failed", err);
                  }
                }}
                className="mt-6 w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300"
              >
                Commit to Step
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedRoadmap;
