"use client";
import { useEffect, useState } from "react";

/** Korte "+25 XP" pop-animatie. Verander `trigger` (bv. Date.now()) om te tonen. */
export default function XpToast({ amount, trigger }: { amount: number; trigger: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (trigger > 0 && amount > 0) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 1600);
      return () => clearTimeout(t);
    }
  }, [trigger, amount]);

  if (!show) return null;
  return (
    <div className="xp-toast" key={trigger}>
      +{amount} XP
      <span className="xp-sub">opgelost!</span>
    </div>
  );
}
