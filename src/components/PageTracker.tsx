import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";

const PageTracker = () => {
  const location = useLocation();
  const { recordVisit } = useAnalytics();

  useEffect(() => {
    recordVisit();
  }, [location.pathname]);

  return null;
};

export default PageTracker;
