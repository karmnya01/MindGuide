import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const PaywallGate = ({ children, requiredTier = "pro" }) => {
  const userInfo = useSelector((state) => state.mindGuide.userInfo);
  const navigate = useNavigate();

  const userTier = userInfo?.subscriptionTier || "free";

  const hasAccess =
    userTier === requiredTier || userTier === "pro" || userTier === "enterprise";

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-mg-surface-2 border border-mg-surface-4 rounded-mg-lg shadow-mg-md">
        <div className="text-4xl mb-4">💎</div>
        <h3 className="text-xl font-display font-semibold text-mg-text-primary mb-2">
          Premium Feature
        </h3>
        <p className="text-mg-text-secondary text-center mb-6 max-w-xs">
          This feature is only available to {requiredTier} members. Upgrade now to
          unlock the full potential of your AI mentor.
        </p>
        <button
          onClick={() => navigate("/upgrade")}
          className="btn-primary w-full bg-mg-brand hover:bg-mg-brand-hover text-white py-2 rounded-mg-md font-semibold shadow-mg-button"
        >
          Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
        </button>
      </div>
    );
  }

  return children;
};

export default PaywallGate;
