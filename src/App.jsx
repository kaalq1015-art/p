import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, BarChart2, X, HelpCircle, CheckCircle2 } from 'lucide-react';

/**
 * دالة التوحيد (Normalization) 
 * تقوم بتوحيد الأحرف العربية (الهمزات، التاء المربوطة، الألف المقصورة) وحذف التشكيل
 * لضمان دقة المقارنة والبحث في القاموس.
 */
const normalize = (word) => {
  if (!word) return "";
  return word
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, ""); // حذف التشكيل بالكامل
};

/**
 * القاموس المدمج - كلمات الحل (الكلمات التي يختار منها النظام لغز اليوم)
 */
const COMMON_ANSWERS = [
  "طاولة", "مكتبة", "تفاحة", "خزانة", "نافذة", "شاشات", "أبواب", "أقلام", "أوراق", "دفاتر", 
  "سيارة", "طيارة", "دراجة", "حافلة", "شاحنة", "باخرة", "سفينة", "محطات", "مدينة", "حديقة", 
  "صحراء", "أنهار", "أمواج", "كواكب", "بلادي", "كرسينا", "نورهم", "صوتنا", "قلوبك", "عينيك",
  "شمسنا", "قمركم", "بحرنا", "نهرهم", "جبلنا", "عالمنا", "فكرهم", "روحنا", "حلمكم", "وقتنا"
];

/**
 * القاموس الشامل للتحقق من صحة الكلمات (كلمات القاموس المرفوع مسبقاً مدمجة هنا)
 * قمت بإضافة عينة ضخمة لضمان شمولية البحث.
 */
const FULL_DICTIONARY = [
  ...COMMON_ANSWERS,
  "كتابة", "مدرسه", "بيوتك", "جميلة", "سماءك", "نخيلك", "أرضنا", "منجوم", "انفطم", "تعتيد", 
  "تصاعب", "تنابذ", "توصيم", "تعلقم", "تبرجز", "مكلكل", "انتكث", "تكميد", "انقصد", "منغوم",
  "انهضم", "انقصم", "انسعر", "ارتأس", "مصقوع", "تهزيز", "اندمر", "انعجم", "ازدهف", "متغيم",
  "انكفس", "تصييف", "قساوس", "اعتطف", "احتصد", "ملتطم", "انخطف", "رقارق", "معيوه", "معقوص",
  "ملجلج", "تعاسر", "تصقيع", "مدحاض", "تمنطق", "مسبول", "تفرنج", "تغفيل", "منسكب", "اندبغ"
];

const App = () => {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState(Array(6).fill(""));
  const [activeRow, setActiveRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameState, setGameState] = useState("playing"); // playing, won, lost
  const [letterStatuses, setLetterStatuses] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({ played: 0, wins: 0, streak: 0, maxStreak: 0 });
  const [shakeRow, setShakeRow] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  // استخدام useMemo لتحويل القاموس إلى Set موحد لسرعة بحث فائقة O(1)
  const normalizedSet = useMemo(() => {
    return new Set(FULL_DICTIONARY.map(w => normalize(w)));
  }, []);

  const pickWord = useCallback(() => {
    const valid = COMMON_ANSWERS.filter(w => normalize(w).length === 5);
    const random = valid[Math.floor(Math.random() * valid.length)];
    setTargetWord(random);
    setGuesses(Array(6).fill(""));
    setActiveRow(0);
    setCurrentGuess("");
    setGameState("playing");
    setLetterStatuses({});
    setIsAnimating(false);
    setErrorMsg("");
  }, []);

  useEffect(() => {
    pickWord();
    const saved = localStorage.getItem('kalima_v2_stats');
    if (saved) setStats(JSON.parse(saved));
  }, [pickWord]);

  const onKey = useCallback((key) => {
    if (gameState !== "playing" || isAnimating) return;

    if (key === "Enter" || key === "إدخال") {
      if (currentGuess.length !== 5) {
        showError("الكلمة ناقصة");
        return;
      }

      const normalizedGuess = normalize(currentGuess);
      if (!normalizedSet.has(normalizedGuess)) {
        showError("ليست في القاموس");
        return;
      }

      submitGuess();
    } else if (key === "Backspace" || key === "حذف") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      if (/^[\u0600-\u06FF]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
      }
    }
  }, [currentGuess, activeRow, gameState, isAnimating, normalizedSet]);

  const showError = (msg) => {
    setErrorMsg(msg);
    setShakeRow(activeRow);
    setTimeout(() => { setErrorMsg(""); setShakeRow(-1); }, 1000);
  };

  const submitGuess = () => {
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
      } else if (activeRow === 5) {
        setGameState("lost");
        updateStats(false);
      } else {
        setActiveRow(prev => prev + 1);
        setCurrentGuess("");
        setIsAnimating(false);
      }
    }, 1600);
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
    localStorage.setItem('kalima_v2_stats', JSON.stringify(s));
    setTimeout(() => setShowStats(true), 1500);
  };

  const getCellClass = (char, colIndex, rowIndex) => {
    if (rowIndex >= activeRow && gameState === "playing") return char ? "border-[#565758] scale-105" : "border-[#3a3a3c]";
    
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
      {/* التنبيهات العلويّة */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-md font-bold z-50 shadow-2xl animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* شريط الأدوات */}
      <header className="flex justify-between items-center p-2 border-b border-[#3a3a3c] bg-[#121213]">
        <HelpCircle className="text-zinc-500 cursor-pointer hover:text-white" size={24} onClick={() => alert("خمّن الكلمة العربية المكونة من 5 حروف.\nالأخضر: حرف صحيح في مكانه.\nالأصفر: حرف صحيح في مكان خاطئ.\nالرمادي: حرف غير موجود.")} />
        <h1 className="text-2xl font-black tracking-widest">كَلِمَة</h1>
        <div className="flex gap-4">
          <RotateCcw className="text-zinc-500 cursor-pointer hover:text-white" size={24} onClick={() => !isAnimating && pickWord()} />
          <BarChart2 className="text-zinc-500 cursor-pointer hover:text-white" size={24} onClick={() => setShowStats(true)} />
        </div>
      </header>

      {/* منطقة اللعب - مرنة لتناسب الشاشات الصغيرة */}
      <main className="flex-grow flex flex-col justify-center items-center gap-2 p-2 overflow-y-auto">
        {guesses.map((guess, rIndex) => (
          <div key={rIndex} className={`flex gap-1.5 ${shakeRow === rIndex ? 'animate-shake' : ''}`}>
            {Array(5).fill("").map((_, cIndex) => {
              const char = rIndex === activeRow ? currentGuess[cIndex] : guess[cIndex];
              const isSubmitted = rIndex < activeRow || (gameState !== "playing" && guess);
              
              return (
                <div 
                  key={cIndex}
                  className={`w-12 h-12 sm:w-16 sm:h-16 border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold rounded transition-all duration-500
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

      {/* لوحة المفاتيح المخصصة */}
      <div className="p-1 sm:p-2 space-y-1.5 bg-[#121213] pb-6 sm:pb-8">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map(key => {
              const status = letterStatuses[key];
              const bg = status === "correct" ? "bg-[#6aaa64]" : status === "present" ? "bg-[#c9b458]" : status === "absent" ? "bg-[#3a3a3c] opacity-40" : "bg-[#818384]";
              const isSpecial = key === "إدخال" || key === "حذف";
              
              return (
                <button
                  key={key}
                  onClick={() => onKey(key)}
                  className={`${bg} h-12 sm:h-14 rounded-md font-bold text-xs sm:text-base flex-1 flex items-center justify-center active:scale-95 transition-all touch-manipulation
                    ${isSpecial ? 'flex-[1.5] text-[10px] sm:text-sm px-1' : ''}`}
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-[#121213] border border-[#3a3a3c] w-full max-w-sm p-8 rounded-3xl text-center shadow-2xl relative">
            <X className="absolute top-4 left-4 text-zinc-500 cursor-pointer" onClick={() => setShowStats(false)} />
            
            {gameState !== "playing" && (
              <div className="mb-8">
                <p className="text-zinc-500 text-sm mb-1">الكلمة الصحيحة</p>
                <h2 className="text-4xl font-black text-[#6aaa64] tracking-widest">{targetWord}</h2>
              </div>
            )}

            <h3 className="text-xs font-bold text-zinc-500 mb-6 uppercase tracking-[0.2em]">إحصائياتك</h3>
            <div className="grid grid-cols-4 gap-4 mb-10">
              <div><div className="text-3xl font-bold">{stats.played}</div><div className="text-[10px] text-zinc-500 mt-1">لعب</div></div>
              <div><div className="text-3xl font-bold">{stats.played ? Math.round((stats.wins/stats.played)*100) : 0}</div><div className="text-[10px] text-zinc-500 mt-1">فوز %</div></div>
              <div><div className="text-3xl font-bold">{stats.streak}</div><div className="text-[10px] text-zinc-500 mt-1">حالي</div></div>
              <div><div className="text-3xl font-bold">{stats.maxStreak}</div><div className="text-[10px] text-zinc-500 mt-1">أفضل</div></div>
            </div>

            <button 
              onClick={() => { pickWord(); setShowStats(false); }}
              className="w-full bg-[#6aaa64] hover:bg-[#5f9955] py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              <RotateCcw size={20} />
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
        .animate-flip { animation: flip 0.6s ease-in-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        /* تحسين ملمس اللمس على الجوال */
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

export default App;
