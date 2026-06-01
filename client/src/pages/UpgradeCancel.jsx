import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const UpgradeCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-[2rem] p-10 text-center shadow-2xl"
            >
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-slate-700">
                    <FontAwesomeIcon icon={faTimesCircle} className="text-slate-500 text-2xl" />
                </div>

                <h1 className="text-3xl font-display font-black text-white mb-4 tracking-tight">
                    Payment <span className="text-slate-500">Cancelled</span>
                </h1>
                
                <p className="text-slate-400 mb-10 leading-relaxed">
                    No worries! We haven't charged your account. You can continue using your current features, and we're here whenever you're ready to level up.
                </p>

                <div className="space-y-4">
                    <button 
                        onClick={() => navigate("/upgrade")}
                        className="w-full py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
                    >
                        Try Again
                    </button>
                    
                    <Link to="/account/dashboard" className="flex items-center justify-center gap-2 text-sm text-slate-500 font-bold hover:text-indigo-400 transition-colors">
                        <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
                        Return to Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default UpgradeCancel;
