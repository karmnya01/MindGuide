import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";

const Layout = () => {
  const location = useLocation();
  const isImmersivePath = location.pathname.includes("/chat/") || location.pathname.includes("/study-rooms/");

  return (
    <div className="flex flex-col min-h-screen">
      {!isImmersivePath && <Header />}
      <div className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      {!isImmersivePath && <Footer />}
    </div>
  );
};

export default Layout;
