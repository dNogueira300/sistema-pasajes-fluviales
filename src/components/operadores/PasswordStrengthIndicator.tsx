"use client";

import { useMemo } from "react";
import { Check, Circle } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements: Requirement[] = useMemo(
    () => [
      { label: "Mínimo 8 caracteres", met: password.length >= 8 },
      { label: "Una letra mayúscula", met: /[A-Z]/.test(password) },
      { label: "Una letra minúscula", met: /[a-z]/.test(password) },
      { label: "Un número", met: /[0-9]/.test(password) },
    ],
    [password]
  );

  const strength = useMemo(() => {
    const metCount = requirements.filter((r) => r.met).length;
    if (metCount <= 1) return { level: "Débil", color: "bg-red-500", width: "w-1/4", textColor: "text-red-400" };
    if (metCount <= 2) return { level: "Media", color: "bg-yellow-500", width: "w-2/4", textColor: "text-yellow-400" };
    if (metCount <= 3) return { level: "Buena", color: "bg-blue-500", width: "w-3/4", textColor: "text-blue-400" };
    return { level: "Fuerte", color: "bg-green-500", width: "w-full", textColor: "text-green-400" };
  }, [requirements]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Seguridad</span>
          <span className={strength.textColor}>{strength.level}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} rounded-full transition-all duration-300 ${strength.width}`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {requirements.map((req) => (
          <div key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.met ? (
              <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
            )}
            <span className={req.met ? "text-green-400" : "text-slate-500"}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
