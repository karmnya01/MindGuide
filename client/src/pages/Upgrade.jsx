import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faRocket, faShieldAlt, faUsers, faStar, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const Upgrade = () => {
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const [loading, setLoading] = useState(null);
  const [config, setConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await axios.get("/api/v1/payment/config");
        setConfig(data);
      } catch (err) {
        toast.error("Failed to load payment configuration");
      }
    };
    fetchConfig();
  }, []);

  const handleUpgrade = async (priceId, tierName) => {
    if (!priceId) return;
    setLoading(tierName);
    try {
      const { data } = await axios.post("/api/v1/payment/create-checkout", {
        priceId,
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Upgrade Error:", error);
      toast.error(error.response?.data?.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: "Free",
      price: "0",
      period: "/mo",
      icon: faShieldAlt,
      features: [
        "2 Basic Self-States",
        "Standard Chat Personas",
        "1 Goal Contract",
        "Weekly Reports",
      ],
      priceId: null,
      buttonText: "Current Plan",
      disabled: true,
    },
    {
      name: "Pro",
      price: "12",
      period: "/mo",
      icon: faStar,
      features: [
        "All 17 Premium Features",
        "5+ Expert Personas",
        "Unlimited Memories",
        "Full Analytics & Insights",
        "7-Day Free Trial",
      ],
      priceId: config?.proMonthlyPriceId,
      buttonText: "Launch Pro Protocol",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "18",
      period: "/seat/mo",
      icon: faUsers,
      features: [
        "Everything in Pro",
        "Admin Dashboard",
        "Team Burnout Heatmaps",
        "SSO & Bulk Onboarding",
        "Dedicated Support",
      ],
      priceId: config?.enterprisePriceId,
      buttonText: "Contact Command",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-24 px-6 font-sans selection:bg-indigo-100 no-scrollbar">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-24">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-6 py-2 bg-white border border-slate-200 rounded-full shadow-sm mb-6">
             <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-600">Premium Growth Modules</span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
            Supercharge Your <span className="text-indigo-600">Evolution.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Unlock high-fidelity intelligence links with persistent memory, deep behavioral analytics, and world-class expert mentors.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={tier.name}
              className={`relative flex flex-col p-12 rounded-[3.5rem] border transition-all duration-500 group ${tier.highlight
                ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-100 scale-105 z-10"
                : "bg-white border-slate-200 hover:border-indigo-100 shadow-sm"
                }`}
            >
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[9px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                  Precision Choice
                </div>
              )}
              
              <div className="flex items-center justify-between mb-8">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${tier.highlight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <FontAwesomeIcon icon={tier.icon} className="text-xl" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                   {tier.name}
                 </h3>
              </div>

              <div className="flex items-baseline mb-10">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  ${tier.price}
                </span>
                <span className="text-slate-400 ml-2 font-black text-xs uppercase tracking-widest">{tier.period}</span>
              </div>

              <ul className="flex-1 space-y-6 mb-12">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4">
                    <FontAwesomeIcon icon={faCheckCircle} className={`${tier.highlight ? 'text-indigo-600' : 'text-slate-300'} mt-0.5`} />
                    <span className="text-[13px] font-bold text-slate-600 tracking-tight leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => tier.priceId && handleUpgrade(tier.priceId, tier.name)}
                disabled={tier.disabled || (loading && loading !== tier.name)}
                className={`w-full py-6 rounded-2xl font-black transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-xl ${tier.highlight
                  ? "bg-indigo-600 hover:bg-slate-900 text-white shadow-indigo-100"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-900"
                  } ${(tier.disabled || (loading && loading !== tier.name)) ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                {loading === tier.name ? "Processing Sync..." : tier.buttonText}
              </button>
              
              {tier.highlight && (
                <p className="text-[10px] font-black text-slate-400 mt-6 text-center uppercase tracking-widest leading-none">
                  Risk-free 7-day trial. Cancel anytime.
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="mt-32 max-w-4xl mx-auto bg-white p-12 md:p-20 rounded-[4rem] border border-slate-200 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
          <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">
            Strategic Inquiries?
          </h4>
          <p className="text-slate-500 text-lg font-medium mb-10 max-w-xl mx-auto">
            Our global support layer is ready to assist you in selecting the optimal protocol for your evolution.
          </p>
          <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 mx-auto group">
            Establish Secure Connection
            <FontAwesomeIcon icon={faChevronRight} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Upgrade;
