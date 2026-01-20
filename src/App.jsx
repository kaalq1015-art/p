import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, BarChart2, X, HelpCircle, RefreshCw } from 'lucide-react';

/**
 * KALIMA V2 - Arabic Wordle 
 * نسخة مدمجة ومحسنة: 8 محاولات وتصميم متوافق مع الكمبيوتر والجوال
 */

// 1. دالة التوحيد لضمان معالجة الحروف بشكل صحيح (Normalization)
const normalize = (word) => {
  if (!word) return "";
  return word
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, ""); // حذف التشكيل
};

// 2. القاموس المدمج - كلمات الحل
const COMMON_ANSWERS = [
  "طاوله", "مكتبه", "تفاحه", "خزانه", "نافذه", "شاشات", "ابواب", "اقلام", "اوراق", "دفاتر", 
  "سياره", "طياره", "دراجه", "حافله", "شاحنه", "باخره", "سفينه", "محطات", "مدينه", "حديقه", 
  "صحراء", "انهار", "امواج", "كواكب", "بلادي", "كرسينا", "نورهم", "صوتنا", "قلوبك", "عينيك",
  "شمسنا", "قمركم", "بحرنا", "نهرهم", "جبلنا", "عالمنا", "فكرهم", "روحنا", "حلمكم", "وقتنا",
  "كتابه", "مدرسه", "بيوتك", "جميله", "سماءك", "نخيلك", "ارضنا", "بلادي", "كرسينا", "قلمهم"
];

// 3. قاموس التحقق الشامل
const FULL_DICTIONARY = [
  ...COMMON_ANSWERS,
  "منجوم", "انفطم", "تعتيد", "تصاعب", "تنابذ", "توصيم", "تعلقم", "تبرجز", "مكلكل", "انتكث", 
  "تكميد", "انقصد", "منغوم", "انهضم", "انقصم", "انسعر", "ارتأس", "مصقوع", "تهزيز", "اندمر", 
  "انعجم", "ازدهف", "متغيم", "انكفس", "تصييف", "قساوس", "اعتطف", "احتصد", "ملتطم", "انخطف", 
  "رقارق", "معيوه", "معقوص", "ملجلج", "تعاسر", "تصقيع", "مدحاض", "تمنطق", "مسبول", "تفرنج", 
  "تغفيل", "منسكب", "اندبغ", "انسطح", "تصميغ", "اعتجر", "مناطح", "مشفوط", "ابتذل", "تصعير", 
  "تنشنش", "انهشم", "مسلطح", "تقابض", "مرابح", "ارتمس", "انفصل", "ابتعد", "اشتهى", "ارتجف"
];

const App = () => {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState(Array(8).fill("")); // تعديل ليكون 8 محاولات
  const [activeRow, setActiveRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameState, setGameState] = useState("playing");
  const [letterStatuses, setLetterStatuses] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({ played: 0, wins: 0, streak: 0, maxStreak: 0 });
  const [shakeRow, setShakeRow] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  const normalizedSet = useMemo(() => {
    return new Set(FULL_DICTIONARY.map(w => normalize(w)));
  }, []);

  const pickWord = useCallback(() => {
    const valid = COMMON_ANSWERS.filter(w => normalize(w).length === 5);
    const word = valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : "كتابه";
    setTargetWord(word);
    setGuesses(Array(8).fill("")); // إعادة الضبط لـ 8 محاولات
    setActiveRow(0);
    setCurrentGuess("");
    setGameState("playing");
    setLetterStatuses({});
    setIsAnimating(false);
    setErrorMsg("");
  }, []);

  useEffect(() => {
    pickWord();
    try {
      const saved = localStorage.getItem('kalima_stats_v3');
      if (saved) setStats(JSON.parse(saved));
    } catch (e) { console.error("Storage failed"); }
  }, [pickWord]);

  const onKey = useCallback((key) => {
    if (gameState !== "playing" || isAnimating) return;

    if (key === "Enter" || key === "إدخال") {
      if (currentGuess.length !== 5) {
        handleError("الكلمة ناقصة");
        return;
      }

      const normalizedGuess = normalize(currentGuess);
      if (!normalizedSet.has(normalizedGuess)) {
        handleError("ليست في القاموس");
        return;
      }

      processGuess();
    } else if (key === "Backspace" || key === "حذف") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      if (/^[\u0600-\u06FF]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
      }
    }
  }, [currentGuess, activeRow, gameState, isAnimating, normalizedSet]);

  const handleError = (msg) => {
    setErrorMsg(msg);
    setShakeRow(activeRow);
    setTimeout(() => { setErrorMsg(""); setShakeRow(-1); }, 1000);
  };

  const processGuess = () => {
    setIsAnimating(true);
    const newGuesses = [...guesses];
    newGuesses[activeRow] = currentGuess;
    setGuesses(newGuesses);

    setTimeout(() => {
      const nTarget = normalize(targetWord);
      const nGuess = normalize(currentGuess);
      const isWin = nGuess === nTarget;
      
      const newStatuses = { ...letterStatuses };
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
      } else if (activeRow === 7) { // المحاولة الأخيرة رقم 8 (0-7)
        setGameState("lost");
        updateStats(false);
      } else {
        setActiveRow(prev => prev + 1);
        setCurrentGuess("");
        setIsAnimating(false);
      }
    }, 1500);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) return;
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
    localStorage.setItem('kalima_stats_v3', JSON.stringify(s));
    setTimeout(() => setShowStats(true), 1500);
  };

  const getCellClass = (char, colIndex, rowIndex) => {
    if (rowIndex >= activeRow && gameState === "playing") {
      return char ? "border-[#565758] scale-105 shadow-sm" : "border-[#3a3a3c]";
    }
    
    const nTarget = normalize(targetWord);
    const nChar = normalize(char);
    if (nChar === nTarget[colIndex]) return "bg-[#6aaa64] border-[#6aaa64] text-white";
    if (nTarget.includes(nChar)) return "bg-[#c9b458] border-[#c9b458] text-white";
    return "bg-[#3a3a3c] border-[#3a3a3c] text-white opacity-80";
  };

  const keyboardRows = [
    ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
    ["ش", "س", "ي", "ب", "ل", "ت", "ن", "م", "ك", "ط", "ذ"],
    ["إدخال", "ر", "ز", "و", "ة", "ى", "ا", "ء", "ئ", "ؤ", "حذف"]
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#121213] text-white font-sans overflow-hidden select-none" dir="rtl">
      
      {/* التنبيهات المنبثقة */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-md font-bold z-[100] shadow-2xl animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* الرأس - محدود العرض للكمبيوتر */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-[#3a3a3c] bg-[#121213] w-full max-w-2xl mx-auto">
        <HelpCircle className="text-zinc-500 cursor-pointer hover:text-white transition-colors" size={24} onClick={() => alert("قواعد اللعبة:\n1. خمّن الكلمة المكونة من 5 حروف.\n2. لديك 8 محاولات.\n3. الأخضر: حرف صحيح في مكانه.\n4. الأصفر: حرف صحيح في مكان خاطئ.")} />
        <h1 className="text-3xl font-black tracking-widest bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">كَلِمَة</h1>
        <div className="flex gap-4">
          <RotateCcw className="text-zinc-500 cursor-pointer hover:text-white transition-colors" size={24} onClick={() => !isAnimating && pickWord()} />
          <BarChart2 className="text-zinc-500 cursor-pointer hover:text-white transition-colors" size={24} onClick={() => setShowStats(true)} />
        </div>
      </header>

      {/* منطقة اللعب - تم تصغير الخلايا قليلاً لتناسب 8 صفوف */}
      <main className="flex-grow flex flex-col justify-center items-center gap-1.5 p-2 overflow-y-auto max-w-2xl mx-auto w-full">
        {guesses.map((guess, rIndex) => (
          <div key={rIndex} className={`flex gap-1.5 ${shakeRow === rIndex ? 'animate-shake' : ''}`}>
            {Array(5).fill("").map((_, cIndex) => {
              const char = rIndex === activeRow ? currentGuess[cIndex] : guess[cIndex];
              const isSubmitted = rIndex < activeRow || (gameState !== "playing" && guess);
              
              return (
                <div 
                  key={cIndex}
                  className={`w-11 h-11 sm:w-14 sm:h-14 border-2 flex items-center justify-center text-xl sm:text-3xl font-bold rounded-sm transition-all duration-500
                    ${getCellClass(char, cIndex, rIndex)}
                    ${isSubmitted ? 'animate-flip' : ''}`}
                  style={{ animationDelay: `${isSubmitted ? cIndex * 150 : 0}ms` }}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </main>

      {/* لوحة المفاتيح - محدودة العرض ومتناسقة مع الكمبيوتر */}
      <div className="p-2 space-y-2 bg-[#121213] pb-6 sm:pb-8 w-full max-w-3xl mx-auto">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map(key => {
              const status = letterStatuses[key];
              const bg = status === "correct" ? "bg-[#6aaa64]" : status === "present" ? "bg-[#c9b458]" : status === "absent" ? "bg-[#313132] opacity-50" : "bg-[#818384]";
              const isSpecial = key === "إدخال" || key === "حذف";
              
              return (
                <button
                  key={key}
                  onClick={() => onKey(key)}
                  className={`${bg} h-12 sm:h-14 rounded-md font-bold text-sm sm:text-lg flex-1 flex items-center justify-center active:scale-95 transition-all
                    ${isSpecial ? 'flex-[1.8] px-2 text-xs sm:text-sm' : 'hover:brightness-110'}`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* نافذة الإحصائيات */}
      {showStats && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm">
          <div className="bg-[#121213] border border-[#3a3a3c] w-full max-w-md p-8 rounded-3xl text-center shadow-2xl relative">
            <X className="absolute top-4 left-4 text-zinc-500 cursor-pointer hover:text-white" onClick={() => setShowStats(false)} />
            
            {gameState !== "playing" && (
              <div className="mb-8">
                <p className="text-zinc-500 text-sm mb-1 uppercase tracking-widest">الكلمة الصحيحة</p>
                <h2 className="text-5xl font-black text-[#6aaa64] tracking-widest">{targetWord}</h2>
              </div>
            )}

            <h3 className="text-xs font-bold text-zinc-500 mb-6 uppercase tracking-[0.3em]">إحصائيات الأداء</h3>
            <div className="grid grid-cols-4 gap-4 mb-10 border-y border-[#3a3a3c] py-6">
              <div><div className="text-3xl font-bold">{stats.played}</div><div className="text-[10px] text-zinc-500">لعب</div></div>
              <div><div className="text-3xl font-bold">{stats.played ? Math.round((stats.wins/stats.played)*100) : 0}</div><div className="text-[10px] text-zinc-500">فوز %</div></div>
              <div><div className="text-3xl font-bold">{stats.streak}</div><div className="text-[10px] text-zinc-500">حالي</div></div>
              <div><div className="text-3xl font-bold">{stats.maxStreak}</div><div className="text-[10px] text-zinc-500">أفضل</div></div>
            </div>

            <button 
              onClick={() => { pickWord(); setShowStats(false); }}
              className="w-full bg-[#6aaa64] hover:bg-[#5f9955] py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              <RefreshCw size={24} />
              لعب مرة أخرى
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flip {
          0% { transform: rotateX(0); }
          50% { transform: rotateX(90deg); }
          100% { transform: rotateX(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-flip { animation: flip 0.6s ease-in-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        * { -webkit-tap-highlight-color: transparent; scrollbar-width: none; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
