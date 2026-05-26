import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCircle, XCircle, Sparkles, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// Premium Balloon Component
const Balloon = ({ color, delay, pos }: { color: string, delay: number, pos: string }) => (
  <motion.div
    initial={{ y: 200, opacity: 0 }}
    animate={{ y: -800, opacity: 1 }}
    transition={{ duration: 12, repeat: Infinity, delay, ease: "linear" }}
    className={`absolute z-0 ${pos}`}
  >
    <div className={`w-14 h-16 ${color} rounded-[50%_50%_50%_50%/40%_40%_60%_60%] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.2)]`} />
    <div className="w-[1px] h-12 bg-white/40 mx-auto" />
  </motion.div>
);

export default function GiftView() {
  const [step, setStep] = useState('landing');
  const [cedula, setCedula] = useState('');
  const [prizeInfo, setPrizeInfo] = useState<{name: string, prize: number} | null>(null);
  const [spinningPrize, setSpinningPrize] = useState(0);

  const startClaiming = () => {
    setStep('claiming');
  }

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (step === 'spinning') {
          interval = setInterval(() => {
              setSpinningPrize(Math.floor(Math.random() * 2500) + 500);
          }, 50);
      }
      return () => clearInterval(interval);
  }, [step]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleValidate = async () => {
    try {
        const response = await fetch('/api/validate-cedula', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula })
        });
        const data = await response.json();
        if (data.valid) {
          setStep('spinning');
          setPrizeInfo({name: data.name, prize: data.prize});
          setTimeout(() => {
              setStep('success');
              triggerConfetti();
          }, 3000);
        } else {
          setStep('error');
        }
    } catch {
        setStep('error');
    }
  };

  const logClaim = async () => {
    if (!prizeInfo) return;
    await fetch('/api/log-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: prizeInfo.name, prize: prizeInfo.prize })
    });
  };

  return (
    <div className="min-h-screen bg-[#4A0404] text-neutral-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-5" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      {step === 'landing' && (
        <>
        </>
      )}

      <AnimatePresence>
        {step === 'success' && (
          <>
            <Balloon color="bg-red-500" delay={0} pos="left-[5%]" />
            <Balloon color="bg-blue-500" delay={1} pos="left-[25%]" />
            <Balloon color="bg-amber-500" delay={2} pos="right-[20%]" />
            <Balloon color="bg-green-500" delay={0.5} pos="right-[10%]" />
          </>
        )}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-gradient-to-br from-neutral-50 to-neutral-200 text-neutral-900 p-8 rounded-3xl text-center shadow-2xl relative border-t border-white/50 overflow-hidden z-10"
        >
          <div className="absolute inset-0 border-2 border-amber-300 rounded-3xl pointer-events-none opacity-40"></div>
          
          {step === 'landing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 rounded-2xl shadow-2xl border-b-8 border-amber-600 rotate-2">
                 <motion.div 
                    animate={{ 
                      rotate: [0, -10, 10, 0], 
                      scale: [1, 1.1, 1],
                      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] 
                    }} 
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                 >
                    <Gift size={80} className="text-amber-400 drop-shadow-2xl" />
                 </motion.div>
              </div>
              <h1 className="text-3xl font-extrabold text-neutral-900 mb-2 font-serif tracking-tight">CLUB RV CASINO</h1>
              <p className="text-amber-500 mb-8 font-bold text-lg">Jugador ACTIVO reclama tu Regalo</p>
              
              <div className="bg-neutral-950 text-amber-400 font-black text-4xl py-6 rounded-2xl mb-8 border border-neutral-800 shadow-inner flex items-center justify-center gap-3">
                RD$5,000+ <Sparkles className="text-amber-400 animate-pulse" size={28} />
              </div>

              <button 
                onClick={startClaiming}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-5 rounded-xl font-bold text-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                ABRIR MI REGALO
              </button>
            </motion.div>
          )}

          {step === 'spinning' && (
             <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.8 }} 
                className="flex flex-col items-center justify-center py-12 relative"
             >
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} 
                    transition={{ duration: 2, repeat: Infinity }} 
                    className="absolute w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" 
                />
                
                <div className="relative w-40 h-40 flex items-center justify-center mb-8">
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }} 
                        className="absolute inset-0 rounded-full border-[12px] border-amber-200/30 border-t-amber-500 border-r-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                    />
                    <motion.div 
                        animate={{ rotate: -360 }} 
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} 
                        className="absolute inset-2 rounded-full border-8 border-dashed border-amber-400/50"
                    />
                    <div className="absolute inset-4 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-full flex items-center justify-center shadow-inner border border-neutral-700 z-10">
                        <span className="text-3xl font-black text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            RD${spinningPrize}
                        </span>
                    </div>
                </div>

                <motion.div 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2"
                >
                    <Sparkles className="text-amber-500 w-6 h-6 animate-pulse" />
                    <p className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-400 font-black text-2xl tracking-widest uppercase drop-shadow-sm">
                        Girando...
                    </p>
                    <Sparkles className="text-amber-500 w-6 h-6 animate-pulse" />
                </motion.div>
             </motion.div>
          )}

          {step === 'claiming' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900 font-serif">Verifica tu cuenta</h2>
              <p className="text-neutral-500 text-sm italic">Ingresa tu cédula para validar el beneficio.</p>
              <input 
                type="text" 
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full bg-neutral-100 p-4 rounded-xl text-neutral-900 text-center text-lg font-mono placeholder:text-neutral-400 focus:ring-4 focus:ring-amber-500 outline-none"
                placeholder="001-0000000-0"
              />
              <button 
                onClick={handleValidate}
                className="w-full bg-neutral-950 text-amber-500 font-black py-4 rounded-xl hover:bg-neutral-800 transition-all text-lg"
              >
                ACTIVAR RECLAMO
              </button>
            </motion.div>
          )}

          {step === 'success' && prizeInfo && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle className="text-green-600" size={60} />
              </div>
              <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">¡LO TIENES, {prizeInfo.name}!</h1>
              <p className="text-neutral-600 mb-2 font-bold text-lg">Tu Bono en crédito es:</p>
              <div className="text-5xl font-black text-red-700 mb-8 p-4 bg-red-100 rounded-2xl border-4 border-dashed border-red-300 shadow-xl">
                RD${prizeInfo.prize.toLocaleString()}
              </div>
              <a 
                href={`https://wa.me/18092840274?text=Hola,%20soy%20${prizeInfo.name},%20he%20ganado%20RD$${prizeInfo.prize}%20en%20la%20ruleta%20promocional%20de%20Club%20RV.`} 
                target="_blank" 
                onClick={logClaim}
                className="flex items-center gap-2 justify-center w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-5 rounded-2xl font-black text-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
              >
                <Send size={24} /> RECLAMAR AHORA
              </a>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <XCircle className="text-red-500 mx-auto mb-6" size={80} />
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">No elegible</h1>
              <p className="text-neutral-500 mb-8 px-4">Este bono es exclusivo para usuarios activos esta semana.</p>
              <button 
                onClick={() => setStep('landing')}
                className="w-full bg-neutral-200 text-neutral-800 py-4 rounded-xl hover:bg-neutral-300 transition-all font-bold"
              >
                Volver
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

