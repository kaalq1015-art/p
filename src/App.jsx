import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, BarChart2, X, HelpCircle } from 'lucide-react';
// استيراد القاموس ودالة المعالجة من الملف المجاور
import { DICTIONARY, normalize } from './dictionary';

/**
 * KALIMA - Arabic Wordle (GitHub Version)
 * كود التطبيق الأساسي مع الربط بملف القاموس الخارجي
 */

// تصفية الكلمات التي طولها 5 أحرف فقط لتكون أهدافاً للعبة
const VALID_TARGETS = DICTIONARY.filter(w => normalize(w).length === 5);

// إنشاء مجموعة للتحقق السريع من التخمينات بعد معالجتها
const VALID_GUESS_SET = new Set(DICTIONARY.map(w => normalize(w)));

const App = () => {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState(Array(8).fill(""));
  const [activeRow, setActiveRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameState, setGameState] = useState("playing");
  const [letterStatuses, setLetterStatuses] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({ played: 0, wins: 0, streak: 0, maxStreak: 0 });
  const [shakeRow, setShakeRow] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  // اختيار كلمة عشوائية
  const pickWord = useCallback(() => {
    if (VALID_TARGETS.length === 0) return;
    const random = VALID_TARGETS[Math.floor(Math.random() * VALID_TARGETS.length)];
    setTargetWord(random);
    setGuesses(Array(8).fill(""));
    setActiveRow(0);
    setCurrentGuess("");
    setGameState("playing");
    setLetterStatuses({});
    setIsAnimating(false);
    setErrorMsg("");
  }, []);

  useEffect(() => {
    pickWord();
    const saved = localStorage.getItem('kalima_stats');
    if (saved) setStats(JSON.parse(saved));
  }, [pickWord]);

  const onKey = useCallback((key) => {
    if (gameState !== "playing" || isAnimating) return;

    if (key === "Enter" || key === "إدخال") {
      if (currentGuess.length !== 5) {
        setErrorMsg("الكلمة ناقصة");
        setShakeRow(activeRow);
        setTimeout(() => { setErrorMsg(""); setShakeRow(-1); }, 1000);
        return;
      }

      // التحقق من القاموس المستورد
      const normalizedGuess = normalize(currentGuess);
      if (!VALID_GUESS_SET.has(normalizedGuess)) {
        setErrorMsg("ليست في القاموس");
        setShakeRow(activeRow);
        setTimeout(() => { setErrorMsg(""); setShakeRow(-1); }, 1000);
        return;
      }

      setIsAnimating(true);
      const newGuesses = [...guesses];
      newGuesses[activeRow] = currentGuess;
      setGuesses(newGuesses);

      // توقيت ظهور الألوان بعد أنيميشن القلب
      setTimeout(() => {
        const isWin = normalizedGuess === normalize(targetWord);
        const newStatuses = { ...letterStatuses };
        const nTarget = normalize(targetWord);

        currentGuess.split('').forEach((char, i) => {
          const nChar = normalize(char);
          let status = "absent";
          if (nChar === nTarget[i]) status = "correct";
          else if (nTarget.includes(nChar)) status = "present";
          
          if (newStatuses[char] !== "correct") {
            newStatuses[char] = status;
          }
        });

        setLetterStatuses(newStatuses);

        if (isWin) {
          setGameState("won");
          updateStats(true);
        } else if (activeRow === 7) {
          setGameState("lost");
          updateStats(false);
        } else {
          setActiveRow(prev => prev + 1);
          setCurrentGuess("");
          setIsAnimating(false);
        }
      }, 2000); 

    } else if (key === "Backspace" || key === "حذف") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      if (/^[\u0600-\u06FF]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
      }
    }
  }, [currentGuess, activeRow, guesses, targetWord, gameState, isAnimating, letterStatuses]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") onKey("Enter");
      else if (e.key === "Backspace") onKey("Backspace");
      else if (e.key.length === 1) onKey(e.key);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKey]);

  const updateStats = (won) => {
    const s = { 
      ...stats, 
      played: stats.played + 1, 
      wins: won ? stats.wins + 1 : stats.wins, 
      streak: won ? stats.streak + 1 : 0, 
      maxStreak: won ? Math.max(stats.maxStreak, stats.streak + 1) : stats.maxStreak 
    };
    setStats(s);
    localStorage.setItem('kalima_stats', JSON.stringify(s));
    setTimeout(() => setShowStats(true), 1200);
  };

  const getResultColor = (char, index) => {
    const nTarget = normalize(targetWord);
    const nChar = normalize(char);
    if (nChar === nTarget[index]) return "bg-[#6aaa64] border-[#6aaa64]";
    if (nTarget.includes(nChar)) return "bg-[#c9b458] border-[#c9b458]";
    return "bg-[#3a3a3c] border-[#3a3a3c]";
  };

  const keyboardRows = [
    ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
    ["ش", "س", "ي", "ب", "ل", "ت", "ن", "م", "ك", "ط", "ذ"],
    ["Enter", "ر", "ز", "و", "ة", "ى", "ا", "ء", "ئ", "ؤ", "Backspace"]
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#121213] text-white overflow-hidden p-2 touch-none" dir="rtl">
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded font-bold z-[100] animate-fade shadow-lg">
          {errorMsg}
        </div>
      )}
      
      <header className="flex justify-between items-center border-b border-[#3a3a3c] py-2 mb-4 px-2">
        <div className="flex gap-4">
          <HelpCircle className="text-zinc-400 cursor-pointer hover:text-white transition-colors" size={26} onClick={() => alert("خمّن الكلمة المطلوبة.")} />
          <RotateCcw className="text-zinc-400 cursor-pointer hover:text-white transition-colors" size={26} onClick={() => !isAnimating && pickWord()} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter">كَلِمَة</h1>
        <BarChart2 className="text-zinc-400 cursor-pointer hover:text-white transition-colors" size={26} onClick={() => setShowStats(true)} />
      </header>

      <main className="flex-grow flex flex-col justify-center gap-1.5 p-2 items-center mb-4">
        {guesses.map((g, r) => {
          const isSubmitted = r < activeRow || gameState !== "playing";
          return (
            <div key={r} className={`flex gap-1.5 ${shakeRow === r ? 'animate-shake' : ''}`}>
              {Array(5).fill("").map((_, c) => {
                const char = r === activeRow ? currentGuess[c] : g[c];
                const resColor = getResultColor(char, c);
                
                return (
                  <div key={c} className="w-12 h-12 sm:w-14 sm:h-14 perspective-1000">
                    <div 
                      className={`relative w-full h-full text-center transition-transform duration-700 preserve-3d ${isSubmitted && g ? 'animate-flip' : ''}`} 
                      style={{ animationDelay: `${isSubmitted ? c * 250 : 0}ms` }}
                    >
                      <div className={`absolute inset-0 border-2 flex items-center justify-center text-2xl font-bold backface-hidden rounded-sm ${char ? 'border-[#565758]' : 'border-[#3a3a3c]'} bg-[#121213]`}>
                        {char || ""}
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold backface-hidden rotate-x-180 rounded-sm border-0 ${resColor}`}>
                        {char || ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </main>

      <div className="p-1 space-y-1.5 pb-6">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map(k => {
              const s = letterStatuses[k];
              const bg = s === "correct" ? "bg-[#6aaa64]" : s === "present" ? "bg-[#c9b458]" : s === "absent" ? "bg-[#3a3a3c] opacity-50" : "bg-[#818384]";
              return (
                <button 
                  key={k} 
                  onClick={() => onKey(k)} 
                  className={`${bg} h-12 rounded font-bold text-xs sm:text-base flex items-center justify-center active:scale-95 transition-all ${k === "Enter" || k === "Backspace" ? 'px-2 flex-[1.5]' : 'flex-1'} ${isAnimating ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {k === "Backspace" ? "حذف" : k === "Enter" ? "إدخال" : k}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {showStats && (
        <div className="fixed inset-0 bg-[#121213]/90 flex items-center justify-center p-4 z-[200]">
          <div className="bg-[#121213] border border-[#3a3a3c] w-full max-w-sm p-8 rounded-xl text-center shadow-2xl relative">
            <X className="absolute top-4 left-4 text-zinc-500 cursor-pointer" onClick={() => setShowStats(false)} />
            {gameState !== "playing" && (
              <div className="mb-6">
                <p className="text-zinc-500 text-xs mb-1 uppercase font-bold tracking-widest">الكلمة الصحيحة</p>
                <h2 className="text-3xl font-black mb-4 uppercase text-[#6aaa64]">{targetWord}</h2>
              </div>
            )}
            <h3 className="text-sm font-bold mb-4 text-zinc-300 uppercase tracking-widest">إحصائياتك</h3>
            <div className="grid grid-cols-4 gap-2 mb-8 text-zinc-400">
              <div><div className="text-2xl text-white font-bold">{stats.played}</div>لعب</div>
              <div><div className="text-2xl text-white font-bold">{stats.played ? Math.round((stats.wins/stats.played)*100) : 0}</div>فوز %</div>
              <div><div className="text-2xl text-white font-bold">{stats.streak}</div>حالي</div>
              <div><div className="text-2xl text-white font-bold">{stats.maxStreak}</div>أفضل</div>
            </div>
            <button onClick={() => { pickWord(); setShowStats(false); }} className="w-full bg-[#6aaa64] hover:bg-[#5f9955] py-4 rounded-lg font-bold transition-colors">تحدي جديد</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flip { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(180deg); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
        @keyframes fade { 0% { opacity: 0; transform: translate(-50%, -20px); } 10% { opacity: 1; transform: translate(-50%, 0); } 90% { opacity: 1; } 100% { opacity: 0; } }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-x-180 { transform: rotateX(180deg); }
        .animate-flip { animation: flip 0.6s forwards ease-in-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-fade { animation: fade 2s forwards; }
      `}</style>
    </div>
  );
};

export default App;
