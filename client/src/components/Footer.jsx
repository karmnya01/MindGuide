import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faTwitter, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
  return (
    <footer className="bg-[#0B0F19] border-t border-slate-800/60 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-xl">M</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Mind<span className="text-indigo-400">Guide</span>
              </h1>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              AI-powered mentoring platform designed to guide you through your learning journey and emotional well-being.
            </p>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-bold mb-6 tracking-tight">Navigation</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Home</Link></li>
              <li><Link to="/counselors" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Counselors</Link></li>
              <li><Link to="/tools" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Assessment Tools</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-bold mb-6 tracking-tight">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-indigo-500 w-4" />
                Jammu, India
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <FontAwesomeIcon icon={faEnvelope} className="text-indigo-500 w-4" />
                support@mindguide.ai
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-bold mb-6 tracking-tight">Follow Us</h3>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                <FontAwesomeIcon icon={faGithub} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs font-medium">
            © {new Date().getFullYear()} Mind-Guide. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-slate-400 text-xs transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-500 hover:text-slate-400 text-xs transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
