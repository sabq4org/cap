import { useEffect } from "react";
import { useLocation } from "wouter";

/** Reset window scroll on every client-side route change (Wouter SPA). */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}
