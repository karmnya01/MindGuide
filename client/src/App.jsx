import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ChatApp from "./pages/ChatApp";
import Tools from "./pages/Tools";
import Counselors from "./pages/Counselors";
import ScrollToTop from "./components/ScrollToTop";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import ProtectRoute from "./components/ProtectRoute";
import VisualRoadmap from "./pages/VisualRoadmap";
import Dashboard from "./pages/Dashboard.jsx";
import GetAllReports from "./components/Dashboard/GetAllReports.jsx";
import Profile from "./components/Dashboard/Profile.jsx";
import HeroDashBoard from "./components/Dashboard/HeroDashBoard.jsx";
import JourneyMap from "./pages/JourneyMap.jsx";
import Upgrade from "./pages/Upgrade.jsx";
import UpgradeSuccess from "./pages/UpgradeSuccess.jsx";
import UpgradeCancel from "./pages/UpgradeCancel.jsx";
import Vault from "./pages/Vault.jsx";
import ReflectionPage from "./pages/ReflectionPage";
import StudyRooms from "./pages/StudyRooms";
import LiveRoom from "./pages/LiveRoom";
import { API_BASE_URL } from "./config/api";

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
function App() {
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const authState = useRef({ getToken, isLoaded, isSignedIn });
  const authReadyWaiters = useRef([]);
  authState.current = { getToken, isLoaded, isSignedIn };

  useLayoutEffect(() => {
    if (isLoaded) {
      authReadyWaiters.current.splice(0).forEach((resolve) => resolve());
    }
  }, [isLoaded]);

  useLayoutEffect(() => {
    const interceptorId = axios.interceptors.request.use(async (config) => {
      const apiOrigin = new URL(API_BASE_URL).origin;
      const requestOrigin = new URL(
        config.url || "",
        config.baseURL || API_BASE_URL
      ).origin;

      if (requestOrigin === apiOrigin) {
        if (!authState.current.isLoaded) {
          await new Promise((resolve, reject) => {
            let timeoutId;
            const onAuthReady = () => {
              window.clearTimeout(timeoutId);
              resolve();
            };
            timeoutId = window.setTimeout(() => {
              authReadyWaiters.current = authReadyWaiters.current.filter(
                (waiter) => waiter !== onAuthReady
              );
              reject(new Error("Clerk authentication did not initialize in time."));
            }, 15000);
            authReadyWaiters.current.push(onAuthReady);
          });
        }

        const auth = authState.current;
        const token = auth.isSignedIn ? await auth.getToken() : null;
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    });

    return () => axios.interceptors.request.eject(interceptorId);
  }, []);

  // console.log("userInfo ", userInfo);
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route element={<ProtectRoute userInfo={userInfo} />}>
              <Route index element={<Home />} />
              <Route path="counselors" element={<Counselors />} />
              {/* Add a dynamic route to capture the counselor type */}
              <Route path="counselors/chat/:type" element={<ChatApp />} />
              <Route path="tools" element={<Tools />} />
              <Route path="account/dashboard" element={<Dashboard />}>
                <Route index element={<HeroDashBoard />} />
                <Route path="reports" element={<GetAllReports />} />
                <Route path="profile" element={<Profile />} />
                <Route path="journey" element={<JourneyMap />} />
                <Route path="vault" element={<Vault />} />
                <Route path="reflection" element={<ReflectionPage />} />
              </Route>
              <Route path="study-rooms" element={<StudyRooms />} />
              <Route path="study-rooms/:id" element={<LiveRoom />} />
            </Route>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="upgrade" element={<Upgrade />} />
            <Route path="upgrade/success" element={<UpgradeSuccess />} />
            <Route path="upgrade/cancel" element={<UpgradeCancel />} />
          </Route>
          <Route path="visualRoadmap" element={<VisualRoadmap />} />
        </Routes>
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
