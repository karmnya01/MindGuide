import axios from "axios";
import { SignUpButton, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../redux/mindGuideSlice";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock, faCamera, faArrowRight } from "@fortawesome/free-solid-svg-icons";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pic, setPic] = useState();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  // Sync Clerk signup with Redux
  useEffect(() => {
    if (isLoaded && isSignedIn && !userInfo) {
      const syncUser = async () => {
        try {
          const response = await axios.get("/api/v1/user/getUserProfile");
          if (response.data) {
            dispatch(addUser(response.data));
            navigate("/");
          }
        } catch (err) {
          console.error("Clerk sync failed", err);
        }
      };
      syncUser();
    }
  }, [isLoaded, isSignedIn, userInfo, dispatch, navigate]);

  const handlePicUpload = async (e) => {
    const pics = e.target.files[0];
    if (!pics) return;
    
    if (
      pics.type === "image/jpeg" ||
      pics.type === "image/jpg" ||
      pics.type === "image/png"
    ) {
      setUploading(true);
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "Mind-Guide");
      data.append("cloud_name", "abhiMiet");
      try {
        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/abhiMiet/image/upload",
          data,
          {
            withCredentials: false,
          }
        );
        toast.success("Profile picture uploaded");
        setPic(response.data.url.toString());
      } catch (error) {
        toast.error("Failed to upload image");
        console.error("Error While uploading image: ", error);
      } finally {
        setUploading(false);
      }
    } else {
      toast.error("Please select a valid image (JPEG/PNG)!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/v1/user/", {
        name,
        email,
        password,
        pic,
      });
      toast.success("Registration Successful");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] py-20 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Intelligence Grains */}
      <div className="absolute top-[-10%] right-[-10%] w-full h-full bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl"
      >
        <div className="mg-glass mg-card-glow rounded-[3rem] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-3">Initialize Identity</h2>
            <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">Begin your professional growth protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Futuristic Pic Upload */}
            <div className="flex justify-center">
              <div className="relative group">
                <div className="w-28 h-28 rounded-3xl bg-indigo-500/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/40 shadow-inner">
                  {pic ? (
                    <img src={pic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                        <FontAwesomeIcon icon={faCamera} className="text-2xl text-slate-700" />
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Biometric</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110">
                  <input type="file" className="hidden" accept="image/*" onChange={handlePicUpload} />
                  <FontAwesomeIcon icon={faCamera} className="text-white text-sm" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center">Full Name</label>
                <div className="relative group">
                  <FontAwesomeIcon icon={faUser} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/30 transition-all font-medium"
                    placeholder="Enter Legal Name"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center">Email Hub</label>
                <div className="relative group">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/30 transition-all font-medium"
                    placeholder="Enter Business Email"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center">Primary Code</label>
                <div className="relative group">
                  <FontAwesomeIcon icon={faLock} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/30 transition-all font-medium"
                    placeholder="Secure Access Token"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center">Verify Code</label>
                <div className="relative group">
                  <FontAwesomeIcon icon={faLock} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder-slate-700 outline-none focus:border-indigo-500/30 transition-all font-medium"
                    placeholder="Confirm Access Token"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="group w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-xs">Authorize Identity</span>
                  <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative pt-4">
              <div className="relative flex justify-center text-center">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">External Identity Verification</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <SignUpButton mode="modal">
                <button className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/10 hover:border-indigo-500/20 group">
                   <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </SignUpButton>
              <SignUpButton mode="modal">
                <button className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/10 hover:border-indigo-500/20 group">
                   <img src="https://www.svgrepo.com/show/447128/apple-black.svg" alt="Apple" className="w-5 h-5 invert opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </SignUpButton>
              <SignUpButton mode="modal">
                <button className="flex items-center justify-center py-4 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/10 hover:border-indigo-500/20 group">
                   <img src="https://www.svgrepo.com/show/475654/github-color.svg" alt="GitHub" className="w-5 h-5 invert opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              </SignUpButton>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest text-center">
              Existing Protocol?{" "}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors ml-1">
                Verify Credentials
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Identity Hub v4.0.2</p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
