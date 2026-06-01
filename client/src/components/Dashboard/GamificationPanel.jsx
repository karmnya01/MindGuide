import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faFire, faStar, faRocket, faMedal } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const GamificationPanel = () => {
    const [stats, setStats] = useState({
        level: 8,
        xp: 4250,
        nextLevelXp: 5000,
        streak: 14
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get("/api/v1/user/userDashboard");
                if (data.user) {
                    setStats({
                        level: data.user.level || 8,
                        xp: data.user.xp || 4250,
                        nextLevelXp: (data.user.level * 1000) || 5000,
                        streak: data.user.streak || 14
                    });
                }
            } catch (err) {
                console.error("Failed to fetch gamification stats", err);
            }
        };
        fetchStats();
    }, []);

    const xpPercentage = (stats.xp / stats.nextLevelXp) * 100;

    return (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group h-full flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="text-center mb-10 relative z-10">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2 font-display">Achievement Hub</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Maturity tracking</p>
            </div>

            <div className="flex flex-col items-center gap-12 relative z-10 flex-1">
                {/* Level Progress Ring */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
                    <div className="w-48 h-48 rounded-full border-[10px] border-slate-100 flex items-center justify-center relative shadow-inner">
                        {/* Static visual representation of progress ring */}
                        <svg className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] -rotate-90">
                           <circle
                              cx="50%"
                              cy="50%"
                              r="48%"
                              className="fill-none stroke-indigo-600 stroke-[10px]"
                              style={{
                                 strokeDasharray: '283',
                                 strokeDashoffset: (283 - (283 * xpPercentage) / 100)
                              }}
                           />
                        </svg>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Level</p>
                            <h4 className="text-6xl font-black text-slate-900 leading-none">{stats.level}</h4>
                        </div>
                    </div>
                </div>

                {/* XP Mapping */}
                <div className="w-full space-y-6">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Progress</span>
                        <span className="text-xs font-black text-indigo-600">{stats.xp} / {stats.nextLevelXp}</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[2px]">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercentage}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        />
                    </div>
                </div>

                {/* Achievement Grid */}
                <div className="grid grid-cols-3 gap-6 w-full mt-4">
                    {[
                        { icon: faTrophy, label: 'Alpha', color: 'indigo' },
                        { icon: faFire, label: 'Streak', color: 'orange' },
                        { icon: faStar, label: 'Elite', color: 'amber' }
                    ].map((badge, i) => (
                        <div key={i} className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer group shadow-sm">
                                <FontAwesomeIcon icon={badge.icon} className="text-lg group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{badge.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 relative z-10 text-center">
                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 group">
                    View Global Ranking
                    <FontAwesomeIcon icon={faRocket} className="ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default GamificationPanel;
