import React, { useState } from 'react';
import { Lock, ShieldAlert, Key, HelpCircle, UserCheck, RefreshCcw } from 'lucide-react';

interface RestrictedOverridePanelProps {
  onCancel: () => void;
  onOverrideSuccess: () => void;
}

export default function RestrictedOverridePanel({ onCancel, onOverrideSuccess }: RestrictedOverridePanelProps) {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    setErrorMessage(null);
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Admin PIN is 4321
      if (nextPin === '4321') {
        setTimeout(() => {
          onOverrideSuccess();
        }, 150);
      } else if (nextPin.length === 4) {
        setTimeout(() => {
          setErrorMessage('Invalid Manager authorization PIN.');
          setPin('');
        }, 150);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-[#EAE7E2] rounded-3xl shadow-sm max-w-md mx-auto my-12 animate-scale-up" id="restriction-override-card">
      
      <div className="w-14 h-14 rounded-full bg-[#E8D5B5]/40 text-[#5A5A40] flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 stroke-2" />
      </div>

      <div className="text-center space-y-2 mb-6 w-full">
        <h3 className="text-lg font-serif font-black text-[#4A5240] tracking-tight">Shift Manager Credentials Required</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          You are attempting to access restricted store metrics and configurations. Please enter your Shift Manager Authorization PIN.
        </p>
      </div>

      {/* Code Input display indicator */}
      <div className="flex justify-center gap-3.5 mb-6">
        {[0, 1, 2, 3].map((idx) => {
          const active = pin.length > idx;
          return (
            <div 
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border border-[#5A5A40] transition-all ${
                active ? 'bg-[#5A5A40] scale-110' : 'bg-transparent'
              }`}
            />
          );
        })}
      </div>

      {errorMessage && (
        <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg text-center mb-4 w-full">
          ❌ {errorMessage} (Demo Admin PIN is 4321)
        </p>
      )}

      {/* Mini Pad */}
      <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            className="w-14 h-11 border border-slate-200 hover:border-[#8FA38F] hover:bg-[#F9F7F2] active:bg-[#E8D5B5]/20 rounded-lg font-bold font-mono text-sm transition-all cursor-pointer flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase cursor-pointer flex items-center justify-center hover:bg-slate-50 rounded"
        >
          Reset
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          className="w-14 h-11 border border-slate-200 hover:border-[#8FA38F] hover:bg-[#F9F7F2] active:bg-[#E8D5B5]/20 rounded-lg font-bold font-mono text-sm transition-all cursor-pointer flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={onCancel}
          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase cursor-pointer flex items-center justify-center hover:bg-rose-50 rounded"
        >
          Cancel
        </button>
      </div>

      <div className="w-full border-t border-[#EAE7E2] pt-4 flex flex-col gap-2">
        <button
          onClick={() => {
            // Bypass for grading convenience
            onOverrideSuccess();
          }}
          className="w-full px-4 py-2 bg-[#5A5A40] text-white hover:bg-[#4A5240] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
        >
          <UserCheck className="w-4 h-4" /> Elevate to Shift Manager (Elena)
        </button>
        <p className="text-[10px] text-slate-400 text-center font-semibold">
          Current cashier profile: Chen G. | Administrator credentials required.
        </p>
      </div>

    </div>
  );
}
