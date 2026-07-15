import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Sparkles, Check, Delete, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Elena Rodriguez',
    role: 'Admin',
    pin: '4321',
    avatarInitials: 'ER'
  },
  {
    id: 'u2',
    name: 'Chen G.',
    role: 'Cashier',
    pin: '1234',
    avatarInitials: 'CG'
  }
];

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleProfileSelect = (user: User) => {
    setSelectedProfile(user);
    setPin('');
    setErrorStatus(null);
  };

  const handleKeyPress = (num: string) => {
    setErrorStatus(null);
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-submit when length reaches 4
      if (nextPin === selectedProfile?.pin) {
        setTimeout(() => {
          onLoginSuccess(selectedProfile);
        }, 150);
      } else if (nextPin.length === 4) {
        // Failed PIN attempt
        setTimeout(() => {
          setShake(true);
          setErrorStatus('Incorrect PIN entered. Admin: 4321 | Cashier: 1234');
          setPin('');
          setTimeout(() => setShake(false), 500);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    setSelectedProfile(null);
    setPin('');
    setErrorStatus(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-center items-center p-4 font-sans text-[#2D2D2A]" id="auth-main-container">
      
      {/* Decorative Natural Header Element */}
      <div className="absolute top-8 text-center" id="branding">
        <h2 className="text-3xl font-serif font-black tracking-tight text-[#4A5240] flex items-center justify-center gap-1.5">
          🌿 Botanica Coffee Co.
        </h2>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8B7E66] mt-1.5">Point of Sale Terminal</p>
      </div>

      <div className={`w-full max-w-md bg-white border border-[#EAE7E2] rounded-3xl p-8 shadow-md transition-all duration-300 ${shake ? 'animate-bounce' : ''}`} id="profile-pane">
        
        {!selectedProfile ? (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#4A5240]">Select Staff Shift Profile</h3>
              <p className="text-xs text-slate-500">Choose your staff account below to open the register session</p>
            </div>

            <div className="grid grid-cols-1 gap-4 py-2">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleProfileSelect(user)}
                  className="flex items-center gap-4 p-4 border border-[#EAE7E2] rounded-2xl bg-[#F9F7F2] hover:bg-[#E8D5B5]/25 hover:border-[#8FA38F] active:bg-[#E8D5B5]/40 text-left transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#8FA38F] text-white flex items-center justify-center font-bold text-sm tracking-wider">
                    {user.avatarInitials}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm group-hover:text-[#4A5240] transition-colors">{user.name}</p>
                    <p className="text-xs font-semibold text-[#8B7E66] tracking-wide mt-0.5 uppercase">Role: {user.role}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-mono italic">
                    PIN: {user.pin}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-[#F5F2EF] border border-[#EAE7E2] rounded-xl p-3 text-center text-xs text-[#8B7E66]">
              💡 <span className="font-semibold">Demo credentials for evaluation:</span><br />
              Elena (Admin) PIN is <code className="font-bold font-mono">4321</code> | Chen (Cashier) PIN is <code className="font-bold font-mono">1234</code>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#EAE7E2] pb-4">
              <button 
                onClick={handleReset}
                className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex-1 text-right">
                <span className="text-[10px] font-black tracking-widest text-[#8B7E66] uppercase block">Selected Profile</span>
                <span className="font-bold text-xs text-[#4A5240]">{selectedProfile.name} ({selectedProfile.role})</span>
              </div>
            </div>

            <div className="text-center space-y-1.5 focus:outline-none">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Enter Shift Session PIN</h3>
              
              {/* Visualized Dots or numbers */}
              <div className="flex justify-center items-center gap-3 py-4">
                {[0, 1, 2, 3].map((idx) => {
                  const hasChar = pin.length > idx;
                  return (
                    <div 
                      key={idx}
                      className={`w-4.5 h-4.5 rounded-full border-2 border-[#5A5A40] flex items-center justify-center transition-all ${
                        hasChar ? 'bg-[#5A5A40]' : 'bg-transparent'
                      }`}
                    >
                      {hasChar && showPin && (
                        <span className="text-[10px] text-white font-bold font-mono">{pin[idx]}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {errorStatus && (
                <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-100 p-2 rounded-lg">
                  {errorStatus}
                </p>
              )}
            </div>

            {/* PIN keypad design */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-12 border border-[#EAE7E2] hover:border-[#8FA38F] hover:bg-[#F9F7F2] active:bg-[#E8D5B5]/25 rounded-xl font-bold font-mono text-sm shadow-2xs hover:shadow-3xs flex items-center justify-center cursor-pointer transition-all"
                >
                  {num}
                </button>
              ))}
              
              {/* Clear button */}
              <button
                type="button"
                onClick={() => setPin('')}
                className="h-12 rounded-xl text-xs font-semibold uppercase hover:bg-slate-50 text-slate-400 cursor-pointer flex items-center justify-center"
              >
                Clear
              </button>

              {/* 0 button */}
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-12 border border-[#EAE7E2] hover:border-[#8FA38F] hover:bg-[#F9F7F2] active:bg-[#E8D5B5]/25 rounded-xl font-bold font-mono text-sm shadow-2xs flex items-center justify-center cursor-pointer transition-all"
              >
                0
              </button>

              {/* Backspace button */}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-xl text-slate-500 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-all"
                title="Backspace"
              >
                <Delete className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Toggle show pin */}
            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => setShowPin(!showPin)} 
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPin ? 'Hide PIN numbers' : 'Show PIN numbers'}
              </button>
            </div>

          </div>
        )}
        
      </div>

      <footer className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-[#8B7E66] text-center space-y-1">
        <div>Register ID: B-POS-001 | Host Sandbox Layer</div>
        <div className="text-[9px] text-slate-400 font-mono">Tap/Click buttons to lock shifting</div>
      </footer>
      
    </div>
  );
}
