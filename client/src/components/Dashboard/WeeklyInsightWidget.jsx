import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faBrain, faSmile, faRobot, faArrowRight, faTrophy, faChartLine } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const WeeklyInsightWidget = () => {
    const [insight, setInsight] = useState("Your neural synthesis is accelerating. Maintaining high focus on core architectural patterns.");
    const [stats, setStats] = useState({
        growth: "+12.4%",
        stability: "High",
        load: "Optimal"
    });

    useEffect(() => {
        const fetchInsight = async () => {
            try {
                const { data } = await axios.get("/api/v1/insights/latest");
                if (data.insight) setInsight(data.insight.mainTakeaway);
            } catch (err) {
                console.error("Failed to fetch custom insights", err);
            }
        };
        fetchInsight();
    }, []);

    return (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Weekly Synthesis</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Output Analysis</p>
                </div>
                <div className="flex gap-3">
                   <div className="px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                      <FontAwesomeIcon icon={faTrophy} className="text-indigo-600 text-xs" />
                      <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest leading-none">Insight Phase: Active</span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
                {[
                    { label: 'Growth Velocity', value: stats.growth, icon: faBolt, color: 'indigo' },
                    { label: 'Mood Stability', value: stats.stability, icon: faSmile, color: 'emerald' },
                    { label: 'Cognitive Load', value: stats.load, icon: faBrain, color: 'purple' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] hover:bg-white hover:shadow-lg hover:shadow-indigo-100 transition-all cursor-default">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 border border-${stat.color}-100`}>
                                <FontAwesomeIcon icon={stat.icon} className="text-xs" />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Main Insight Section */}
            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-indigo-200 transition-all relative z-10">
                <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                        <FontAwesomeIcon icon={faRobot} className="text-xl" />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pt-1 leading-none">Primary Takeaway</h4>
                        <p className="text-slate-600 font-medium leading-relaxed italic pr-4">
                            "{insight}"
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-10 flex justify-end relative z-10">
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-700 transition-colors flex items-center gap-2 group">
                    Full Behavioral Mapping
                    <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default WeeklyInsightWidget;
