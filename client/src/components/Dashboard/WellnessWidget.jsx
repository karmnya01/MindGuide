import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeartbeat, faBatteryThreeQuarters, faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const WellnessWidget = () => {
    const [wellnessData, setWellnessData] = useState({
        burnoutScore: 0,
        energyLevel: "High",
        recoveryScore: 0
    });

    useEffect(() => {
        const fetchWellness = async () => {
            try {
                const { data } = await axios.get("/api/v1/user/userDashboard");
                if (data.user) {
                    setWellnessData({
                        burnoutScore: data.user.burnoutScore !== undefined ? data.user.burnoutScore : 0,
                        energyLevel: data.user.energyLevel || "High",
                        recoveryScore: data.user.recoveryScore || 0
                    });
                }
            } catch (err) {
                console.error("Failed to fetch wellness data", err);
            }
        };
        fetchWellness();
    }, []);

    const getEnergyColor = (level) => {
        switch (level?.toLowerCase()) {
            case "high": return "text-emerald-600";
            case "medium": return "text-amber-600";
            case "low": return "text-rose-600";
            default: return "text-indigo-600";
        }
    };

    const getEnergyBG = (level) => {
      switch (level?.toLowerCase()) {
          case "high": return "bg-emerald-50 border-emerald-100";
          case "medium": return "bg-amber-50 border-amber-100";
          case "low": return "bg-rose-50 border-rose-100";
          default: return "bg-indigo-50 border-indigo-100";
      }
  };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Wellness & Resilience
                  </h3>
                  <FontAwesomeIcon icon={faHeartbeat} className="text-rose-500/30 text-xl" />
              </div>

              <div className="space-y-8 relative z-10">
                  {/* Burnout Meter */}
                  <div>
                      <div className="flex justify-between items-end mb-3">
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Burnout Index</span>
                          <span className={`text-3xl font-black ${wellnessData.burnoutScore > 70 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {wellnessData.burnoutScore}%
                          </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${wellnessData.burnoutScore}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={`h-full rounded-full ${wellnessData.burnoutScore > 70 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : wellnessData.burnoutScore > 40 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                          />
                      </div>
                  </div>

                  {/* Indicators Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className={`p-5 rounded-2xl border transition-all ${getEnergyBG(wellnessData.energyLevel)}`}>
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Energy Level</span>
                          <div className="flex items-center gap-3">
                              <FontAwesomeIcon icon={faBatteryThreeQuarters} className={`${getEnergyColor(wellnessData.energyLevel)}`} />
                              <span className={`text-lg font-black ${getEnergyColor(wellnessData.energyLevel)}`}>
                                  {wellnessData.energyLevel}
                              </span>
                          </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Protocol Sync</span>
                          <div className="flex items-center gap-3">
                              <FontAwesomeIcon icon={faSyncAlt} className="text-indigo-600 animate-spin-slow" />
                              <span className="text-lg font-black text-slate-700">Active</span>
                          </div>
                      </div>
                  </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                <div>
                     <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Stability Score</p>
                     <p className="text-[10px] text-slate-400 font-medium tracking-tight">Derived from consistent AI engagement</p>
                </div>
                <div className="text-3xl font-black text-white px-6 py-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                    {wellnessData.recoveryScore}
                </div>
            </div>
        </div>
    );
};

export default WellnessWidget;
