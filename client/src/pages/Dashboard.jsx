import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTachometerAlt, faChartPie, faMapMarkedAlt, faUserCircle, faSignOutAlt, faBars, faTimes, faBrain } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const currentTab = location.pathname.split("/")[3];

  const options = [
    {
      title: "Overview",
      icon: faTachometerAlt,
      link: "",
    },
    {
      title: "Analytics & Reports",
      icon: faChartPie,
      link: "./reports",
    },
    {
      title: "My Journey",
      icon: faMapMarkedAlt,
      link: "./journey",
    },
    {
      title: "Memory Vault",
      icon: faBrain,
      link: "./vault",
    },
    {
      title: "Reflection Log",
      icon: faMapMarkedAlt,
      link: "./reflection",
    },
    {
      title: "Profile Settings",
      icon: faUserCircle,
      link: "./profile",
    },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden relative">

      {/* Mobile Header & Hamburger */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-tighter">MG</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Growth Hub</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200"
        >
          <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
              onClick={() => setIsSidebarOpen(false)}
            />

            <motion.nav
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed md:relative z-50 w-72 h-full bg-white border-r border-slate-200 flex flex-col shadow-xl md:shadow-none"
            >
              <div className="hidden md:flex items-center gap-4 px-8 py-10 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="text-white font-black text-xl tracking-tighter">MG</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Growth Hub</h1>
              </div>

              <div className="md:hidden flex items-center justify-between px-6 py-6 border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Menu</h1>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 p-2"><FontAwesomeIcon icon={faTimes} /></button>
              </div>

              <div className="flex-1 flex flex-col gap-2 px-4 mt-6 md:mt-4 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Navigation</p>

                {options.map((option, i) => {
                  const isActive = (!currentTab && option.link === "") || `./${currentTab}` === option.link;
                  return (
                    <Link
                      key={i}
                      to={option.link}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold group relative overflow-hidden
                        ${isActive
                          ? "text-indigo-600 bg-indigo-50 border border-indigo-100 shadow-sm"
                          : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                        <FontAwesomeIcon icon={option.icon} />
                      </div>
                      {option.title}
                    </Link>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100">
                <Link to="/counselors" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold border border-transparent hover:border-rose-100">
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Exit Dashboard
                </Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative scroll-smooth overflow-scroll pt-20 md:pt-0 p-4 md:p-8 lg:p-10 w-full overflow-hidden bg-white/50 backdrop-blur-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="h-full max-w-7xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
