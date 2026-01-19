import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, BarChart2, X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { DICTIONARY, normalize } from './dictionary';

/** * تم دمج حل لمشكلة الكيبورد في الكمبيوتر
 * وتم تصغير الأحجام لتناسب 8 محاولات
 */

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

  const pickWord = useCallback(() => {
    const pool = DICTIONARY.ANSWERS_LIST;
    const random = pool[Math.floor(Math.random() * pool.length)];
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
    const saved = localStorage.getItem('kalima_v16_stats');
    if (saved) setStats(JSON.parse(saved));
  }, [pickWord]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== 5) {
      setErrorMsg("الكلمة ناقصة");
      setShakeRow(activeRow);
      setTimeout(() => { setErrorMsg(""); setShakeRow(-1); }, 1000);
      return;
    }
    if (!DICTIONARY.GUESS_SET.has(normalize(currentGuess))) {
      setErrorMsg("خطأ");
      setShakeRow(activeRow);
      setTimeout(() => { setErrorMsg(""); setShakeRow(-1); }, 1000);
      return;
    }

    setIsAnimating(true);
    const newGuesses = [...guesses];
    newGuesses[activeRow] = currentGuess;
    setGuesses(newGuesses);

    setTimeout(() => {
      const isWin = normalize(currentGuess) === normalize(targetWord);
      const newStatuses = { ...letterStatuses };
      const nTarget = normalize(targetWord);

      currentGuess.split('').forEach((char, i) => {
        const nChar = normalize(char);
        let status = "absent";
        if (nChar === nTarget[i]) status = "correct";
        else if (nTarget.includes(nChar)) status = "present";
        if (newStatuses[char] !== "correct") newStatuses[char] = status;
      });
      setLetterStatuses(newStatuses);

      if (isWin) {
        setGameState("won");
        const s = { ...stats, played: stats.played + 1, wins: stats.wins + 1, streak: stats.streak + 1, maxStreak: Math.max(stats.maxStreak, stats.streak + 1) };
        setStats(s);
        localStorage.setItem('kalima_v16_stats', JSON.stringify(s));
        setTimeout(() => setShowStats(true), 1200);
      } else if (activeRow === 7) {
        setGameState("lost");
        const s = { ...stats, played: stats.played + 1, streak: 0 };
        setStats(s);
        localStorage.setItem('kalima_v16_stats', JSON.stringify(s));
        setTimeout(() => setShowStats(true), 1200);
      } else {
        setActiveRow(prev => prev + 1);
        setCurrentGuess("");
        setIsAnimating(false);
      }
    }, 2200); 
  }, [currentGuess, activeRow, guesses, targetWord, stats, letterStatuses]);

  const onKey = useCallback((key) => {
    if (gameState !== "playing" || isAnimating || errorMsg) return;
    if (key === "Enter") {
      submitGuess();
    } else if (key === "Backspace") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[\u0600-\u06FF]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  }, [gameState, isAnimating, errorMsg, currentGuess, submitGuess]);

  // مستمع للوحة المفاتيح الحقيقية (الكمبيوتر)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") onKey("Enter");
      else if (e.key === "Backspace") onKey("Backspace");
      else if (e.key.length === 1) {
        // خريطة بسيطة لبعض الأحرف الإنجليزية إلى العربية لتسهيل الكتابة (اختياري)
        onKey(e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKey]);

  const getTileColor = (char, index, rowIdx) => {
    if (rowIdx >= activeRow && gameState === "playing") return "";
    if (guesses[rowIdx] === "") return "";
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#121213] text-white overflow-hidden p-2 touch-none font-sans" dir="rtl">
      {errorMsg && <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded font-bold z-[100] shadow-lg animate-fade">{errorMsg}</div>}
      
      <header className="flex justify-between items-center border-b border-[#3a3a3c] py-1 mb-2">
        <div className="flex gap-2">
          <HelpCircle className="text-zinc-400 cursor-pointer" size={20} onClick={() => alert("خمّن الكلمة في 8 محاولات.")} />
          <RotateCcw className="text-zinc-400 cursor-pointer" size={20} onClick={() => !isAnimating && pickWord()} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase">كَلِمَة</h1>
        <BarChart2 className="text-zinc-400 cursor-pointer" size={20} onClick={() => setShowStats(true)} />
      </header>

      <main className="flex-grow flex flex-col justify-center gap-1 mb-2 overflow-y-auto w-full items-center">
        {guesses.map((g, r) => {
          const isSub = g && (r < activeRow || gameState !== "playing");
          return (
            <div key={r} className={`flex gap-1 ${shakeRow === r ? 'animate-shake' : ''}`}>
              {Array(5).fill("").map((_, c) => {
                const char = r === activeRow ? currentGuess[c] : g[c];
                return (
                  <div key={c} className="w-9 h-9 sm:w-12 sm:h-12 perspective-1000">
                    <div 
                      className={`relative w-full h-full text-center transition-transform duration-700 preserve-3d ${isSub ? 'animate-flip' : ''} ${char && r === activeRow ? 'animate-pop' : ''}`}
                      style={{ animationDelay: `${isSub ? c * 300 : 0}ms` }}
                    >
                      <div className={`absolute inset-0 border-2 flex items-center justify-center text-lg sm:text-xl font-bold backface-hidden rounded-sm ${char ? 'border-[#565758]' : 'border-[#3a3a3c]'}`}>{char}</div>
                      <div className={`absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold backface-hidden rotate-x-180 rounded-sm border-0 ${getTileColor(char, c, r)}`}>{char}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </main>

      <div className="pb-2 space-y-1">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 px-1">
            {row.map(k => {
              const s = letterStatuses[k];
              const bg = s === "correct" ? "bg-[#6aaa64]" : s === "present" ? "bg-[#c9b458]" : s === "absent" ? "bg-[#3a3a3c] opacity-50" : "bg-[#818384]";
              return (
                <button 
                  key={k} 
                  onClick={() => onKey(k)} 
                  className={`${bg} h-11 sm:h-12 rounded font-bold text-xs sm:text-base flex items-center justify-center active:scale-95 transition-all ${k === "Enter" || k === "Backspace" ? 'px-2 flex-[1.8]' : 'flex-1'} ${isAnimating ? 'opacity-40 cursor-not-allowed' : ''}`}
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
          <div className="bg-[#121213] border border-[#3a3a3c] w-full max-w-sm p-6 rounded-xl text-center shadow-2xl relative">
            <X className="absolute top-4 left-4 text-zinc-500 cursor-pointer" onClick={() => setShowStats(false)} />
            {gameState !== "playing" && (
              <div className="mb-4">
                <p className="text-zinc-500 text-xs mb-1 uppercase font-bold tracking-widest font-sans">الكلمة هي</p>
                <h2 className="text-3xl font-black mb-3 uppercase tracking-widest">{targetWord}</h2>
                <div className={`font-bold ${gameState === 'won' ? 'text-[#6aaa64]' : 'text-red-500'}`}>{gameState === 'won' ? 'تم الحل بنجاح!' : 'للأسف، لم تنجح!'}</div>
              </div>
            )}
            <h3 className="text-sm font-bold mb-4 text-zinc-300 tracking-widest uppercase">إحصائياتك</h3>
            <div className="grid grid-cols-4 gap-2 mb-6 text-zinc-400">
              <div><div className="text-xl text-white font-bold">{stats.played}</div><div className="text-[10px]">لعب</div></div>
              <div><div className="text-xl text-white font-bold">{stats.played ? Math.round((stats.wins/stats.played)*100) : 0}</div><div className="text-[10px]">فوز %</div></div>
              <div><div className="text-xl text-white font-bold">{stats.streak}</div><div className="text-[10px]">حالي</div></div>
              <div><div className="text-xl text-white font-bold">{stats.maxStreak}</div><div className="text-[10px]">أفضل</div></div>
            </div>
            <button onClick={() => { pickWord(); setShowStats(false); }} className="w-full bg-[#6aaa64] py-3 rounded-lg font-bold text-lg">تحدي جديد</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flip { 0% { transform: rotateX(0deg); } 50% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
        @keyframes fade { 0% { opacity: 0; transform: translateY(-10px); } 10%, 90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-x-180 { transform: rotateX(180deg); }
        .animate-flip { animation: flip 0.6s forwards ease-in-out; }
        .animate-pop { animation: pop 0.1s ease-in-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-fade { animation: fade 1.5s forwards; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
