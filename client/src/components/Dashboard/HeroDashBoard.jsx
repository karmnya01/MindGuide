import axios from "axios";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Bar, Pie, Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faRocket, faChartLine, faBrain, faBolt, faCompass } from "@fortawesome/free-solid-svg-icons";
import GamificationPanel from "./GamificationPanel";
import WeeklyInsightWidget from "./WeeklyInsightWidget";
import WellnessWidget from "./WellnessWidget";

const HeroDashBoard = () => {
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const isPro = userInfo?.subscriptionTier === "pro" || userInfo?.subscriptionTier === "enterprise";

  // Chart States
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [{ label: "Sessions", data: [], backgroundColor: "rgba(79, 70, 229, 0.2)", borderColor: "rgba(79, 70, 229, 1)", borderWidth: 2 }]
  });

  const [pieChartData, setPieChartData] = useState({
    labels: [],
    datasets: [{ label: "Focus", data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]
  });

  const [lineChartData, setLineChartData] = useState({
    labels: [],
    datasets: [
      { label: "Sessions", data: [], borderColor: "rgba(79, 70, 229, 1)", tension: 0.4 },
      { label: "Reports", data: [], borderColor: "rgba(244, 63, 94, 1)", tension: 0.4 }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/v1/user/userDashboard");
        updateCharts(data.user);
      } catch (err) {
        console.error("Dashboard Sync Failed", err);
      }
    };
    fetchData();
  }, []);

  const updateCharts = (userData) => {
    // Session Distribution
    const sessionsPerDay = userData.sessionHistory.reduce((acc, session) => {
      const date = new Date(session.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    setBarChartData({
      labels: Object.keys(sessionsPerDay),
      datasets: [{
        label: "Sessions Attended",
        data: Object.values(sessionsPerDay),
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 2,
        borderRadius: 8
      }]
    });

    // Counselor Focus (Pie)
    const sessionsPerCounselor = userData.reportHistory.reduce((acc, session) => {
      acc[session.title] = (acc[session.title] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(sessionsPerCounselor);
    setPieChartData({
      labels,
      datasets: [{
        label: "Counselor Sessions",
        data: Object.values(sessionsPerCounselor),
        backgroundColor: labels.map((_, i) => `hsla(${230 + (i * 40)}, 70%, 60%, 0.6)`),
        borderColor: labels.map((_, i) => `hsla(${230 + (i * 40)}, 70%, 60%, 1)`),
        borderWidth: 2
      }]
    });

    // Growth Momentum (Line)
    const reportsPerDay = userData.reportHistory.reduce((acc, report) => {
      const date = new Date(report.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const allDates = [...new Set([...Object.keys(sessionsPerDay), ...Object.keys(reportsPerDay)])].sort();
    setLineChartData({
      labels: allDates,
      datasets: [
        { label: "Sessions", data: allDates.map(d => sessionsPerDay[d] || 0), borderColor: "#4F46E5", tension: 0.4 },
        { label: "Reports", data: allDates.map(d => reportsPerDay[d] || 0), borderColor: "#F43F5E", tension: 0.4 }
      ]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { weight: '600', size: 10 } } },
      y: { grid: { color: "#f1f5f9" }, ticks: { color: "#64748b", font: { weight: '600', size: 10 } }, beginAtZero: true }
    }
  };

  return (
    <div className="space-y-10 pb-20 bg-[#F8FAFC] min-h-screen p-4 md:p-8 font-sans selection:bg-indigo-100 no-scrollbar">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-b border-slate-200 pb-10">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 leading-none">
            Intelligence <span className="text-indigo-600">Command.</span>
          </h2>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">Neural Core Online</span>
             </div>
             <p className="text-sm font-medium text-slate-500">Welcome, {userInfo?.name || 'Architect'}. Synced to version 2.4.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {isPro && (
             <motion.div whileHover={{ scale: 1.05 }} className="px-6 py-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-100 flex items-center gap-3">
                <FontAwesomeIcon icon={faCrown} className="text-amber-400 text-sm" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Tier: Executive Pro</span>
             </motion.div>
           )}
           <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all cursor-pointer shadow-sm">
              <FontAwesomeIcon icon={faRocket} />
           </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Intelligence Quotient', value: '142', sub: '+2.4% Neural Gain', icon: faBrain, color: 'indigo' },
          { label: 'Growth Streak', value: '14 Days', sub: 'Top 5% Globally', icon: faBolt, color: 'emerald' },
          { label: 'Resilience Index', value: 'High', sub: 'Zero Burnout Risk', icon: faChartLine, color: 'rose' },
          { label: 'Current Context', value: 'Explorer', sub: 'Phase 4 Maturity', icon: faCompass, color: 'purple' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[2.5rem] p-10 border border-slate-200 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-500"
          >
            <div className={`p-4 bg-${stat.color}-50 rounded-2xl w-fit text-${stat.color}-600 mb-8 border border-${stat.color}-100`}>
                <FontAwesomeIcon icon={stat.icon} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">{stat.label}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">{stat.value}</h3>
            <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Adaptive Insights Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <WellnessWidget />
          <WeeklyInsightWidget />
        </div>
        <div className="sticky top-28">
          <GamificationPanel />
        </div>
      </div>

      {/* Analytics Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
        
        {/* Trend A: Session Volume */}
        <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 flex flex-col h-[480px] shadow-sm">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 leading-none">Historical Load</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Session Pulse</h2>
            </div>
          </div>
          <div className="flex-1 relative">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Trend B: Specialized Focus */}
        <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 flex flex-col h-[480px] shadow-sm">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 leading-none">Knowledge Area</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Growth Vectors</h2>
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4">
             <Pie data={pieChartData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, font: { weight: '700', size: 10 } } } } }} />
          </div>
        </div>

        {/* Trend C: Progress Momentum */}
        <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 flex flex-col h-[480px] md:col-span-2 xl:col-span-1 shadow-sm">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 leading-none">Velocity Metrics</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Neural Momentum</h2>
            </div>
          </div>
          <div className="flex-1 relative">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center pt-16 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.4em]">
          Mind-Guide Neural Engine v2.4.0 • Enterprise Security Layer Active
        </p>
      </footer>
    </div>
  );
};

export default HeroDashBoard;
