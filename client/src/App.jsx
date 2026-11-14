import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
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

axios.defaults.baseURL = "http://localhost:3005";
axios.defaults.withCredentials = true;
function App() {
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
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
