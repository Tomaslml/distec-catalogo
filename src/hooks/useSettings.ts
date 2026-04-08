import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
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

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    if (isFirebaseConfigured) {
      try {
        const snap = await getDoc(doc(db, "settings", "config"));
        if (snap.exists()) {
          setSettings(snap.data() as StoreSettings);
        } else {
          await setDoc(doc(db, "settings", "config"), defaultSettings);
          setSettings(defaultSettings);
        }
      } catch {
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
    if (isFirebaseConfigured) {
      await setDoc(doc(db, "settings", "config"), data);
    }
    localStorage.setItem("distec_settings", JSON.stringify(data));
    setSettings(data);
  };

  return { settings, loading, saveSettings, refetch: fetchSettings };
}
