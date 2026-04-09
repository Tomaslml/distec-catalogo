import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { defaultSettings } from "@/lib/seedData";

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  email: string;
  couponCode: string;
  couponPercent: number;
  paymentMethods: {
    transfer: boolean;
    mercadopago: boolean;
    cash: boolean;
  };
}

const TABLE = "settings";

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select("*")
          .eq("id", "config")
          .single();

        if (data) {
          setSettings(data.content as StoreSettings);
        } else if (!error) {
          await supabase.from(TABLE).insert({ id: "config", content: defaultSettings });
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error("Supabase settings fetch error:", err);
        const stored = localStorage.getItem("distec_settings");
        setSettings(stored ? JSON.parse(stored) : defaultSettings);
      }
    } else {
      const stored = localStorage.getItem("distec_settings");
      setSettings(stored ? JSON.parse(stored) : defaultSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async (data: StoreSettings) => {
    if (isSupabaseConfigured) {
      await supabase.from(TABLE).upsert({ id: "config", content: data });
    }
    localStorage.setItem("distec_settings", JSON.stringify(data));
    setSettings(data);
  };

  return { settings, loading, saveSettings, refetch: fetchSettings };
}
