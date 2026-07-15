import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, CheckCircle, Wifi, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentSimulatorProps {
  method: 'card' | 'mobile';
  amount: number;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

export default function PaymentSimulator({ method, amount, onSuccess, onCancel }: PaymentSimulatorProps) {
  const [step, setStep] = useState<'idle' | 'reading' | 'processing' | 'authorizing' | 'success'>('idle');
  const [statusText, setStatusText] = useState('INSERT, SWIPE OR TAP CARD');
  const [txCode, setTxCode] = useState('');

  useEffect(() => {
    if (method === 'mobile') {
      setStatusText('DRAP PHONE OR SCAN QR TO PAY');
    } else {
      setStatusText('INSERT, SWIPE OR TAP CARD');
    }
  }, [method]);

  const handleInteract = () => {
    if (step !== 'idle') return;

    // Start simulation steps
    setStep('reading');
    setStatusText('Reading NFC / Chip details...');

    setTimeout(() => {
      setStep('processing');
      setStatusText('Contacting Merchant Gateway...');

      setTimeout(() => {
        setStep('authorizing');
        setStatusText('Verifying sufficient funds with cardholder bank...');

        setTimeout(() => {
          setStep('success');
          setStatusText('Authorization Approved!');
          
          const code = `SIM_${method === 'card' ? 'CR' : 'MB'}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          setTxCode(code);

          // Return success after a brief delay
          setTimeout(() => {
            onSuccess(code);
          }, 1200);

        }, 1200);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-[#EAE7E2] w-full max-w-md shadow-xl overflow-hidden animate-scale-up" id="payment-terminal-simulator">
        
        {/* Terminal Header */}
        <div className="bg-[#4A5240] text-white px-5 py-3 flex justify-between items-center border-b border-[#5A5A40]">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-[#8FA38F] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Botanica Merchant Terminal</span>
          </div>
          <span className="text-[9px] bg-[#8FA38F]/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">Simulated</span>
        </div>

        {/* Terminal Screen screen overlay */}
        <div className="p-6 bg-[#2D2D2A] text-[#8FA38F] font-mono border-b-6 border-[#EAE7E2] select-none text-center space-y-4">
          <div className="border border-[#8FA38F]/30 bg-black/40 rounded-xl p-4 min-h-24 flex flex-col justify-between">
            <span className="text-[9px] text-[#8B7E66] uppercase tracking-wider block">Transaction Amount</span>
            <span className="text-3xl font-black text-white tracking-tight">${amount.toFixed(2)}</span>
            
            <div className="mt-3 py-1 bg-[#4A5240]/20 border-t border-b border-[#8FA38F]/20 text-xs">
              {step === 'idle' && <span className="animate-pulse">● {statusText}</span>}
              {step !== 'idle' && <span>{statusText}</span>}
            </div>

            {step === 'success' && (
              <div className="text-[10px] text-[#E8D5B5] mt-1">
                Ref: {txCode}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Device Body */}
        <div className="p-8 bg-[#F9F7F2] flex flex-col items-center justify-center space-y-6">
          {step === 'idle' && (
            <div className="text-center space-y-4 w-full">
              {method === 'card' ? (
                <div className="space-y-4">
                  {/* Credit Card Graphic */}
                  <button 
                    onClick={handleInteract}
                    className="w-full h-36 bg-gradient-to-br from-[#5A5A40] to-[#2D2D2A] text-[#EAE7E2] p-4 rounded-xl shadow-md text-left flex flex-col justify-between border border-[#8FA38F]/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-8 h-8 text-[#E8D5B5] group-hover:animate-bounce" />
                      <Wifi className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="w-10 h-7 bg-[#E8D5B5]/60 rounded-md mb-2"></div>
                      <p className="text-[11px] uppercase tracking-widest font-mono font-bold">Simulated Debit/Credit</p>
                      <p className="text-[9px] text-slate-400 font-mono">Click or Tap to process</p>
                    </div>
                  </button>
                  <p className="text-xs text-slate-500 font-semibold px-4">
                    Click the payment card above to simulate inserting chip or tapping near terminal.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  {/* Contactless Device Graphic */}
                  <button 
                    onClick={handleInteract}
                    className="w-full h-36 bg-white border border-[#EAE7E2] rounded-2xl shadow-xs py-4 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
                  >
                    <Smartphone className="w-10 h-10 text-[#5A5A40] animate-bounce" />
                    
                    {/* Tiny QR Code Simulator representation */}
                    <div className="w-14 h-14 bg-slate-900 p-1 rounded-md flex items-center justify-center">
                      <div className="w-full h-full bg-repeating border-4 border-dashed border-white"></div>
                    </div>

                    <span className="text-[10px] font-black uppercase text-[#5A5A40] tracking-wider mt-1">Tap/Hold Phone to NFC Reader</span>
                  </button>
                  <p className="text-xs text-slate-500 font-semibold px-4">
                    Click the interface above to simulate Apple Pay, Google Pay, or QR scan.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reading State */}
          {(step === 'reading' || step === 'processing' || step === 'authorizing') && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-12 h-12 text-[#5A5A40] animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Gateway Secure Uplink</p>
                <div className="text-xs text-slate-400 font-sans italic">Simulating terminal handshake...</div>
              </div>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="py-4 flex flex-col items-center justify-center space-y-4 animate-scale-up">
              <CheckCircle className="w-16 h-16 text-[#8FA38F] fill-[#8FA38F]/10 stroke-2" />
              <div className="text-center space-y-1">
                <p className="text-lg font-black text-[#4A5240] font-serif">Simulated Success!</p>
                <p className="text-xs text-slate-500">Transaction approved and registered securely.</p>
              </div>
            </div>
          )}

          {/* Cancel option in Simulator */}
          {step === 'idle' && (
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
            >
              Cancel Payment Simulation
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
