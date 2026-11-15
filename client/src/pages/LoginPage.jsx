import axios from "axios";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { addUser } from "../redux/mindGuideSlice";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faArrowRight } from "@fortawesome/free-solid-svg-icons";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const dispatch = useDispatch();
  const { isLoaded, isSignedIn } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/v1/user/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      dispatch(addUser(response.data));
      toast.success("Login Successful");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoaded) return;

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/v1/user/getUserProfile");
        if (response.data) {
          dispatch(addUser(response.data));
        }
      } catch (err) {
        if (isSignedIn) {
          console.error("Clerk profile sync failed", err);
          toast.error(
            err.response?.data?.message ||
              "Could not sync your account. Check your Clerk production keys and API connection."
          );
        }
      }
    };
    fetchUserProfile();
  }, [dispatch, isLoaded, isSignedIn]);

  useEffect(() => {
    if (userInfo) {
      navigate("/");
    }
  }, [navigate, userInfo]);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Intelligence Grains */}
      <div className="absolute top-[-20%] left-[-10%] w-full h-full bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[480px]"
      >
        <div className="mg-glass mg-card-glow rounded-[3rem] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 mb-8 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
              <FontAwesomeIcon icon={faLock} className="text-indigo-400 text-3xl" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-3">Neural Core Access</h2>
            <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">Mind-Guide Intelligence Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="email" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Identity Credentials
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/30 transition-all font-medium"
                  placeholder="Enter Registered Email"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="password" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Access Token
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                  <FontAwesomeIcon icon={faLock} />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/30 transition-all font-medium"
                  placeholder="Enter Secure Password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-xs">Verify Access</span>
                  <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12">
            <div className="relative mb-10 text-center">
               <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Secure Alternative Entry</span>
            </div>

            {!isSignedIn ? <div className="grid grid-cols-3 gap-5">
              <SignInButton mode="modal">
                <button className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/10 hover:border-indigo-500/20 group">
                   <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/10 hover:border-indigo-500/20 group">
                   <img src="https://www.svgrepo.com/show/447128/apple-black.svg" alt="Apple" className="w-5 h-5 invert opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/10 hover:border-indigo-500/20 group">
                   <img src="https://www.svgrepo.com/show/475654/github-color.svg" alt="GitHub" className="w-5 h-5 invert opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </SignInButton>
            </div> : <p className="text-center text-xs text-slate-400">Your session is active. Syncing your profile…</p>}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                New Identity?{' '}
                <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors ml-1">
                    Begin Initialization
                </Link>
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Protocol Mind-Guide v4.0.2</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
