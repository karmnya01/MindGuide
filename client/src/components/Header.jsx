import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faChartPie, faCompass, faBriefcase, faGem, faUsers, faTachometerAlt } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const location = useLocation();

  const isPro = userInfo?.subscriptionTier === "pro" || userInfo?.subscriptionTier === "enterprise";

  const navLinks = [
    { title: "Home", path: "/", icon: faCompass },
    { title: "AI Mentors", path: "/counselors", icon: faBriefcase },
    { title: "Dashboard", path: "/account/dashboard", icon: faTachometerAlt },
    { title: "Study Rooms", path: "/study-rooms", icon: faUsers, live: true },
    { title: "Tools", path: "/tools", icon: faChartPie },
    ...(!isPro ? [{ title: "Upgrade", path: "/upgrade", icon: faGem }] : []),
  ];

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 w-full shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform duration-500">
             <span className="text-white font-black text-2xl tracking-tighter">MG</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">
              Mind<span className="text-indigo-600">Guide</span>
            </h1>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 pr-1">Intelligence Layer</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 px-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + "/");
            const isLive = link.live;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${
                  isActive 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <FontAwesomeIcon icon={link.icon} className="text-sm" />
                {link.title}
                {isLive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-6">
          {isPro && (
             <div className="hidden sm:flex px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Member: Pro</span>
             </div>
          )}

          <Link to={userInfo ? "/account/dashboard/profile" : "/login"}>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-4 px-6 py-3 rounded-2xl transition-all border duration-300 ${
                userInfo 
                   ? "bg-white border-slate-200 hover:border-indigo-600 group shadow-sm" 
                   : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-100"
              }`}
            >
              {userInfo ? (
                <>
                  <div className="w-9 h-9 rounded-full border-2 border-indigo-100 p-0.5 overflow-hidden group-hover:border-indigo-600 transition-colors">
                    <img
                      src={userInfo.pic}
                      alt={userInfo.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="flex flex-col items-start leading-none pr-2">
                     <span className="text-sm font-black text-slate-900 tracking-tight">
                        {userInfo.name.split(' ')[0]}
                     </span>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Settings</span>
                  </div>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserCircle} className="text-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Architect Login</span>
                </>
              )}
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
