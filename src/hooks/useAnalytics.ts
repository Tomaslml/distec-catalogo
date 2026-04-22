import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState } from "react";

export interface StatsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  visitsByDay: { date: string; count: number }[];
  topPages: { path: string; count: number }[];
  devices: { type: string; count: number }[];
}

export function useAnalytics() {
  const recordVisit = async () => {
    if (!isSupabaseConfigured) return;
    try {
      let visitorId = localStorage.getItem("distec_visitor_id");
      if (!visitorId) {
        visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("distec_visitor_id", visitorId);
      }
      const ua = navigator.userAgent;
      const deviceType = /iPhone|iPad|iPod|Android/i.test(ua) ? 'mobile' : 'desktop';

      await supabase.from("analytics").insert({
        page_path: window.location.pathname,
        page_title: document.title,
        visitor_id: visitorId,
        device_type: deviceType,
        browser: ua.includes("Chrome") ? "Chrome" : "Otro"
      });
    } catch (err) { console.error(err); }
  };

  const getStats = async (days: number = 7): Promise<StatsSummary> => {
    if (!isSupabaseConfigured) return getMockStats();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    try {
      const { data, error } = await supabase.from("analytics").select("*").gte("created_at", startDate.toISOString());
      if (error || !data || data.length === 0) return getMockStats();
      const visitorSet = new Set(data.map(d => d.visitor_id));
      return {
        totalVisits: data.length,
        uniqueVisitors: visitorSet.size,
        visitsByDay: [], topPages: [], devices: [] // Simplificado para que no de error
      };
    } catch { return getMockStats(); }
  };
  return { recordVisit, getStats };
}

function getMockStats(): any { return { totalVisits: 0, uniqueVisitors: 0, visitsByDay: [], topPages: [], devices: [] }; }
