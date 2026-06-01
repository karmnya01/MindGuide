import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faRocket, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addUser } from "../redux/mindGuideSlice";

const UpgradeSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [status, setStatus] = useState("verifying");
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        const verifyPayment = async () => {
            if (!sessionId) {
                setStatus("error");
                return;
            }

            try {
                const { data } = await axios.post("/api/v1/user/upgrade-success", { sessionId });
                if (data.success) {
                    setStatus("success");
                    dispatch(addUser(data.user));
                    toast.success("Welcome to Mind-Guide Pro!");
                } else {
                    setStatus("error");
                }
            } catch (err) {
                console.error("Payment verification failed", err);
                setStatus("error");
            }
        };

        verifyPayment();
    }, [sessionId]);

    if (status === "error") {
        return (
            <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-rose-500 text-2xl">?</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
                    <p className="text-slate-400 mb-8">We couldn't verify your payment. If you believe this is an error, please contact support.</p>
                    <Link to="/upgrade" className="inline-block w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all">
                        Back to Billing
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px]" />

            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-[#111827]/80 backdrop-blur-xl border border-indigo-500/30 rounded-[2.5rem] p-10 text-center shadow-2xl relative z-10"
            >
                <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/40 rotate-12">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-white text-3xl" />
                </div>

                <h1 className="text-4xl font-display font-black text-white mb-4 tracking-tight">
                    Upgrade <span className="text-indigo-400">Complete!</span>
                </h1>
                
                <p className="text-slate-400 mb-10 leading-relaxed">
                    Welcome to the Pro Tier. Your advanced mentors and deep analytics are now unlocked and ready for your first session.
                </p>

                <div className="space-y-4">
                    <button 
                        onClick={() => navigate("/account/dashboard")}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3 group"
                    >
                        <span>Go to Dashboard</span>
                        <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <button 
                        onClick={() => navigate("/counselors")}
                        className="w-full py-4 bg-slate-800/50 text-slate-300 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                    >
                        <FontAwesomeIcon icon={faRocket} className="text-indigo-400" />
                        <span>Meet Pro Mentors</span>
                    </button>
                </div>

                <p className="mt-8 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600">
                    Mind-Guide Professional Subscription Active
                </p>
            </motion.div>
        </div>
    );
};

export default UpgradeSuccess;
