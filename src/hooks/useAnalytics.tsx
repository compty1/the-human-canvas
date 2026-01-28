import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Generate a simple fingerprint for visitor tracking (anonymous)
const generateVisitorId = (): string => {
  const stored = localStorage.getItem("visitor_id");
  if (stored) return stored;
  
  const id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("visitor_id", id);
  return id;
};

// Generate session ID (new per browser session)
const getSessionId = (): string => {
  const stored = sessionStorage.getItem("session_id");
  if (stored) return stored;
  
  const id = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("session_id", id);
  return id;
};

// Detect device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
};

// Get screen size category
const getScreenSize = (): string => {
  const width = window.innerWidth;
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  return "xl";
};

export const useAnalytics = () => {
  const location = useLocation();
  const pageLoadTime = useRef<number>(Date.now());
  const visitorId = useRef<string>(generateVisitorId());
  const sessionId = useRef<string>(getSessionId());
  const hasTrackedSession = useRef<boolean>(false);

  // Track session start
  const trackSessionStart = useCallback(async () => {
    if (hasTrackedSession.current) return;
    hasTrackedSession.current = true;

    try {
      await supabase.from("sessions").upsert({
        id: sessionId.current,
        visitor_id: visitorId.current,
        entry_page: location.pathname,
        pages_viewed: 1,
      }, { onConflict: "id" });
    } catch (error) {
      console.error("Error tracking session:", error);
    }
  }, [location.pathname]);

  // Track page view
  const trackPageView = useCallback(async (path: string) => {
    try {
      await supabase.from("page_views").insert({
        page_path: path,
        visitor_id: visitorId.current,
        session_id: sessionId.current,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        screen_size: getScreenSize(),
      });

      // Update session pages viewed
      const { data: session } = await supabase
        .from("sessions")
        .select("pages_viewed")
        .eq("id", sessionId.current)
        .single();

      if (session) {
        await supabase
          .from("sessions")
          .update({
            pages_viewed: (session.pages_viewed || 0) + 1,
            exit_page: path,
          })
          .eq("id", sessionId.current);
      }
    } catch (error) {
      console.error("Error tracking page view:", error);
    }
  }, []);

  // Track time on page (called before leaving)
  const trackTimeOnPage = useCallback(async () => {
    const timeSpent = Math.round((Date.now() - pageLoadTime.current) / 1000);
    
    try {
      // Update the most recent page view with time spent
      const { data } = await supabase
        .from("page_views")
        .select("id")
        .eq("visitor_id", visitorId.current)
        .eq("session_id", sessionId.current)
        .order("timestamp", { ascending: false })
        .limit(1);

      if (data && data[0]) {
        await supabase
          .from("page_views")
          .update({ time_on_page_seconds: timeSpent })
          .eq("id", data[0].id);
      }
    } catch (error) {
      console.error("Error tracking time on page:", error);
    }
  }, []);

  // Track link clicks
  const trackLinkClick = useCallback(async (url: string, text: string) => {
    try {
      await supabase.from("link_clicks").insert({
        page_path: location.pathname,
        link_url: url,
        link_text: text,
        visitor_id: visitorId.current,
        session_id: sessionId.current,
      });
    } catch (error) {
      console.error("Error tracking link click:", error);
    }
  }, [location.pathname]);

  // Track page views on route change
  useEffect(() => {
    // Track time on previous page
    if (pageLoadTime.current !== Date.now()) {
      trackTimeOnPage();
    }

    // Reset page load time
    pageLoadTime.current = Date.now();

    // Track session start
    trackSessionStart();

    // Track new page view
    trackPageView(location.pathname);

    // Track time when leaving page
    const handleBeforeUnload = () => {
      trackTimeOnPage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [location.pathname, trackPageView, trackSessionStart, trackTimeOnPage]);

  // Set up global link click tracking
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link) {
        const href = link.getAttribute("href");
        const text = link.textContent?.trim() || "";
        if (href) {
          trackLinkClick(href, text);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [trackLinkClick]);

  return {
    trackLinkClick,
    visitorId: visitorId.current,
    sessionId: sessionId.current,
  };
};
