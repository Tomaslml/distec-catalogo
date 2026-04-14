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
    // No ponemos loading(true) aqu si ya tenemos algo en localStorage para que no parpadee
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select("*")
          .eq("id", "config")
          .limit(1);

        if (data && data.length > 0) {
          const content = data[0].content as StoreSettings;
          setSettings(content);
          localStorage.setItem("distec_settings", JSON.stringify(content));
        } else if (!error) {
          await supabase.from(TABLE).insert({ id: "config", content: defaultSettings });
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error("Supabase settings fetch error:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // Intentamos cargar de localStorage inmediatamente para que no tarde 8 segundos
    const stored = localStorage.getItem("distec_settings");
    if (stored) {
      setSettings(JSON.parse(stored));
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const saveSettings = async (data: StoreSettings) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLE).upsert({ id: "config", content: data });
      if (error) throw error;
    }
    localStorage.setItem("distec_settings", JSON.stringify(data));
    setSettings(data);
  };

  return { settings, loading, saveSettings, refetch: fetchSettings };
}
