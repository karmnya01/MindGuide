import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeUser } from "../../redux/mindGuideSlice";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faEnvelope, faCalendarAlt, faUserGraduate, faStar, faShieldAlt, faTrash } from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const skills = userInfo.skills || [];
  const TechSkills = [];
  const nonTechSkills = [];

  skills.forEach((skill) => {
    if (skill.type === "technical" || skill.type?.toLowerCase() === "technical") {
      TechSkills.push(skill.skill || skill.name || skill);
    } else {
      nonTechSkills.push(skill.skill || skill.name || skill);
    }
  });

  const handleLogout = async () => {
    try {
      await axios.post("/api/v1/user/logout");
      dispatch(removeUser());
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error in logging out", error);
      toast.error("Failed to logout");
    }
  };

  const createdAtDate = new Date(userInfo.createdAt || Date.now());
  const formattedCreatedAt = createdAtDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="h-full overflow-y-auto scroll-smooth p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Profile Settings</h2>
          <p className="text-slate-400">Manage your account and view your earned skills.</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-rose-500/20 shadow-sm"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-[#111827] border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="shrink-0 relative">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden shadow-2xl relative z-10">
            <img
              src={userInfo.pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
              alt={userInfo.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" }}
            />
          </div>
          <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-indigo-500 rounded-full border-4 border-[#111827] flex items-center justify-center text-white shadow-lg z-20">
            <FontAwesomeIcon icon={faStar} className="text-sm" />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 text-center md:text-left z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white capitalize tracking-tight mb-1">
              {userInfo.name}
            </h1>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Active Member
            </span>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-center md:justify-start gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <span className="font-medium">{userInfo.email}</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
              <span className="font-medium">Joined {formattedCreatedAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Technical Skills */}
        <div className="bg-[#111827] border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Technical Skills</h2>
          </div>

          {TechSkills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {TechSkills.map((skill, index) => (
                <div key={index} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2 text-sm font-medium text-slate-300 shadow-sm hover:border-indigo-500/50 hover:bg-slate-700 transition-colors cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  {typeof skill === 'object' ? JSON.stringify(skill) : skill}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
              <p className="text-slate-500 text-sm">No technical skills recorded yet. Complete roadmaps to earn skills!</p>
            </div>
          )}
        </div>

        {/* Non-Technical Skills */}
        <div className="bg-[#111827] border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FontAwesomeIcon icon={faStar} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Soft Skills</h2>
          </div>

          {nonTechSkills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {nonTechSkills.map((skill, index) => (
                <div key={index} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2 text-sm font-medium text-slate-300 shadow-sm hover:border-purple-500/50 hover:bg-slate-700 transition-colors cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  {typeof skill === 'object' ? JSON.stringify(skill) : skill}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
              <p className="text-slate-500 text-sm">No soft skills recorded yet. Engage with the mentor to develop soft skills.</p>
            </div>
          )}
        </div>

      </div>

      {/* F07: Identity Statements Section */}
      <div className="mt-8 bg-[#111827] border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FontAwesomeIcon icon={faShieldAlt} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Identity Statements</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Your Core Truths</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <p className="text-sm text-slate-400">
            Define who you are. These statements act as the ultimate guide for your AI mentors.
            Example: "I am a disciplined learner who prioritizes problem-solving over quick fixes."
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const text = e.target.statement.value;
              if (!text.trim()) return;
              try {
                const { data } = await axios.post("/api/v1/user/identity-statements", { text });
                toast.success("Identity statement added!");
                e.target.reset();
                window.location.reload(); // Refresh to show new statement (simple approach)
              } catch (err) {
                toast.error("Failed to add statement");
              }
            }}
            className="flex gap-3"
          >
            <input
              name="statement"
              placeholder="Enter a new identity statement..."
              className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              Add
            </button>
          </form>

          <div className="space-y-3">
            {userInfo.identityStatements?.map((stmt, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[#0B0F19] border border-slate-800/80 rounded-2xl group">
                <p className="text-sm font-medium text-slate-200">"{stmt.text}"</p>
                <button
                  onClick={async () => {
                    try {
                      await axios.delete(`/api/v1/user/identity-statements/${stmt._id}`);
                      toast.success("Statement removed");
                      window.location.reload();
                    } catch (err) {
                      toast.error("Failed to remove statement");
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-500 transition-all"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Profile;
