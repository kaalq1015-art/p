<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كَلِمَة | النسخة الاحترافية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        
        :root {
            --color-correct: #538d4e;
            --color-present: #b59f3b;
            --color-absent: #3a3a3c;
            --color-border: #3a3a3c;
            --color-tile-bg: #121213;
        }

        body {
            font-family: 'Tajawal', sans-serif;
            background-color: #121213;
            color: white;
            margin: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .tile {
            width: 60px;
            height: 60px;
            border: 2px solid var(--color-border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            user-select: none;
            transition: transform 0.1s ease;
        }

        .tile.pop { transform: scale(1.1); border-color: #565758; }
        .tile.correct { background-color: var(--color-correct); border-color: var(--color-correct); }
        .tile.present { background-color: var(--color-present); border-color: var(--color-present); }
        .tile.absent { background-color: var(--color-absent); border-color: var(--color-absent); }

        .key {
            background-color: #818384;
            height: 58px;
            border-radius: 4px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: opacity 0.1s;
        }

        .key.correct { background-color: var(--color-correct); }
        .key.present { background-color: var(--color-present); }
        .key.absent { background-color: var(--color-absent); }

        @keyframes flip {
            0% { transform: rotateX(0); }
            50% { transform: rotateX(90deg); }
            100% { transform: rotateX(0); }
        }
        .flip { animation: flip 0.6s ease-in-out; }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.5s ease-in-out; }

        .modal-bg { background-color: rgba(0,0,0,0.7); backdrop-filter: blur(2px); }
    </style>
</head>
<body>

    <header class="border-b border-[#3a3a3c] p-4 flex justify-between items-center">
        <div class="w-8"></div>
        <h1 class="text-3xl font-bold tracking-tighter">كَلِمَة</h1>
        <button id="statsBtn" class="p-1 hover:bg-[#3a3a3c] rounded">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        </button>
    </header>

    <main class="flex-grow flex items-center justify-center">
        <div id="grid" class="grid grid-rows-6 gap-2"></div>
    </main>

    <div id="keyboard" class="p-2 max-w-lg mx-auto w-full mb-4"></div>

    <!-- Toast Notification -->
    <div id="toast" class="fixed top-24 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded font-bold hidden z-50 shadow-xl"></div>

    <!-- Stats Modal -->
    <div id="modal" class="fixed inset-0 modal-bg z-50 flex items-center justify-center hidden p-4">
        <div class="bg-[#121213] border border-[#3a3a3c] rounded-lg p-8 max-w-sm w-full text-center relative">
            <button id="closeModal" class="absolute top-4 left-4 text-gray-400">✕</button>
            <h2 class="text-xl font-bold mb-6">الإحصائيات</h2>
            <div class="flex justify-around mb-8">
                <div><div id="playedCount" class="text-3xl font-bold">0</div><div class="text-xs">لعب</div></div>
                <div><div id="winPercent" class="text-3xl font-bold">0</div><div class="text-xs">% فوز</div></div>
                <div><div id="streakCount" class="text-3xl font-bold">0</div><div class="text-xs">سلسلة</div></div>
            </div>
            <button id="shareBtn" class="w-full bg-[#538d4e] py-3 rounded font-bold text-lg hover:bg-opacity-90">مشاركة النتيجة</button>
        </div>
    </div>

    <script>
        // 1. الكلمات المستهدفة (كلمة اليوم)
        const TARGETS = ["نعناع", "موهوب", "ينبوع", "تفاحة", "طاووس", "شاحنة", "مقترح", "مبارك", "مسمار", "تاريخ", "منطاد", "ميزان", "فنجان", "رمضان", "عصفور", "مهارة", "تجارة", "دولة", "فوز", "كتاب", "طبيب", "شاعر"];
        
        // 2. القاموس الكامل للمحاولات (الكلمات التي يُسمح للاعب بكتابتها)
        const DICTIONARY = ["نعناع", "موهوب", "ينبوع", "تفاحة", "كوادر", "طاووس", "شاحنة", "مقترح", "عشرون", "عجائب", "ذوبان", "مبارك", "عوجاء", "معطاء", "ليونة", "بضاعة", "نصيحة", "توجيب", "بنتان", "ظرفاء", "بادية", "مرايا", "مادية", "شفغاء", "بائقة", "كابوس", "مقهقه", "تلاوة", "مذاعة", "مقالة", "مسمار", "مستاء", "تصويب", "باكرة", "مرساة", "مراجع", "كارثة", "تابوت", "شواغر", "نواهي", "صحراء", "نوايا", "غلاظة", "ريحان", "وجيزة", "نقاهة", "نكراء", "تاريخ", "مجلات", "طاغوت", "وسطاء", "ولادة", "ترضية", "توصية", "خضراء", "باحثة", "منطاد", "مقولة", "مجنحة", "مؤدبة", "تعيسة", "مبتسم", "وكلاء", "عنقاء", "تابعة", "متضحية", "نشطاء", "باقة", "ميزان", "ترجمة", "ثرثار", "جيران", "باهية", "مطبوع", "توظيف", "فنجان", "ماضية", "مبسطة", "مصفاة", "قمامة", "حيوان", "جاسوس", "رمضان", "عصفور", "مهارة", "مشوشة", "تنقيب", "تضاعف", "مترفة", "عزباة", "عذراء", "تجارة", "زعماء", "محلات", "ترقية", "تمايل", "ميلاد", "بلدان", "توضيح", "ريعان", "وسيمة", "مذاهب", "فضيحة", "مصونة", "مائية", "مرجان", "مباحة", "متحور", "باعثة", "زملاء", "جدارة", "مثمرة", "مقدمة", "كرماء", "تسلية", "مشاكس", "عميقة", "مهينة", "توديع", "تشرذم", "توفير", "موسوس", "شواطئ", "تاجرة", "وهمية", "باخرة", "قانون", "ملونة", "محدود", "لطفاء", "وصاية", "متعال", "مؤذية", "نظيفة", "شرفاء", "حمراء", "ناموس", "مأمون", "مسافر", "بدانة", "توصيل", "لفافة", "جاموس", "مباني", "فواكه", "صابون", "غلمان", "مجرات", "ثقافة", "تائبة", "تأسيس", "توفيق", "ميناء", "مجيدة", "وزراء", "مباحث", "وكيلة", "تضارب", "متيمة", "تسوية", "تائهة", "علماء", "ميقات", "معيشة", "بائعة", "ديوان", "صاروخ", "تعبئة", "فانوس", "تفاهة", "مأكول", "مضياف", "مشوهة", "ماشية", "باهتة", "مؤيدة", "وكالة", "بطلان", "كنيسة", "مجدية", "قرنفل", "خواطر", "مجتاز", "توفية", "غرامة", "معتدل", "عواطف", "زخارف", "ملامح", "عامود", "مناعة", "عصفور", "ملعقة", "زرافة", "معقول", "زراعة", "تمثيل", "سداسي", "مهاجر", "جراحة", "معاكس", "شبيبة", "معابد", "مجاهد", "تجريب", "مواقد", "شريفة", "عنصري", "مساجد", "سلامة", "بطيخة", "سجادة", "رزينة", "شحاذة", "حفلات", "لطافة", "تعنيف", "متاحف", "راغبة", "معزوم", "تسلسل", "سلاحف", "مدارس", "مستور", "رباعي", "تعريف", "مواقف", "هيفاء", "ثخينة", "تحميل", "مكاتب", "علامة", "مواضع", "ثنائي", "لطيفة", "تسبيح", "مجالس", "توريد", "معاهد", "مصاحب", "رفيعة", "تحفيز", "مكتبة", "بوصلة", "كلمات", "دائرة", "مسموح", "شعراء", "زرعات", "مساعد", "سذاجة", "سميحة", "همسات", "جرافة", "دراقة", "مختبر", "مكياج", "مسلسل", "تصريح", "سحابة", "فارقة", "خماسي", "مجموع", "مثبتة", "ممتعة", "مماثل", "عائدة", "صناعة", "مجربة", "معبدة", "ممنوع", "مصاحف", "مكافح", "تقنية", "مجروح", "مصطحب", "صحيحة", "فارسة", "شوائب", "ثلاثي", "مواكب", "زهراء", "سهولة", "متاجر", "مقاتل", "صفراء", "خاطئة", "مقروء", "دائرة", "توحيد", "كهيلة", "الستة", "صعوبة", "مربعة", "مجوهره", "مقاعد", "مطروح", "مكتوب", "هادفة", "مدافع", "شبابي", "ترهيب", "تجريح", "كهولة", "سجينة", "معدات", "لوحات", "هجرات", "عفراء", "مشاعر", "مرادف", "خنساء", "مدروس", "كواشف", "عباءة", "محتوى", "حلقات", "كريمة", "تسنيم", "مهنية", "شاحبة", "عصيبة", "مقتول", "موصول", "معينة", "محبوب", "باسطة", "سابقة", "مخطوف", "جاهلة", "مقطور", "غفلان", "مجبور", "نشطاء", "مبثوق", "ظالمة", "محاول", "تورية", "ماعون", "مجاوز", "مخشية", "أجزاء", "مشيئة", "ثكلان", "موهوم", "ناضجة", "أعيان", "مغروم", "فاتحة", "منقوص", "فائحة", "مبروم", "حاكمة", "ميزان", "محسوب", "خاطرة", "محمول", "بارزة", "موشوم", "منطوق", "ساجدة", "مرصوص", "تيجان", "محمود", "إطراء", "مدموج", "ظافرة", "ملكوم", "عرفان", "مقصود", "طغيان", "مجزية", "إبداء", "مهنية", "واعدة", "تأميم", "لاقطة", "معدوم", "صابرة", "مكلوم", "طاعنة", "مرزوق", "حاضنة", "متفوق", "ظاهرة", "تأويل", "شامخة", "ممحوة", "تلقاء", "مبعوث", "فاحصة", "مأبون", "راسخة", "مجذوب", "طارحة", "ملموس", "نابغة", "مرسوم", "إبقاء", "مأثوم", "عمران", "حاسمة", "مراود", "محروق", "إذعان", "متحول", "مثقوب", "واثقة", "محروم", "فائزة", "متبوع", "تنمية", "مخطوط", "ناقضة", "مخصوص", "رجحان", "متذوق", "وجدان", "مأثور", "مجروح", "مليئة", "محفوف", "شاكرة", "خاتمة", "تكييس", "محاذر", "التفع", "تسريب", "مداوم", "تفريع", "مفتوق", "مرتجع", "تمكين", "التحف", "تناسق", "مضبوط", "تناذر", "ابتلج", "مملوح", "غطريس", "مكتنز", "التبس", "تلويم", "انحجب", "تقليم", "وساوس", "متقرح", "تعميد", "أبواق", "تفصيح", "مقنطر", "توشيح", "مخالف", "تبعثر", "مهاجم", "فوضوي", "مكهرب", "اندفع", "تكميم", "أعماق", "اغتمس", "مشتمل", "تعارف", "تهاتر", "معلوف", "تأقلم", "تباعد", "إقبال", "معروق", "انفسد", "أحوال", "تقنين", "ماجدة", "نواحي", "متهرئ", "عطشان", "تنفيس", "إمهال", "توزيع", "مخاطب", "تفاقم", "ابتعث", "مهلهل", "وقائع", "تنصير", "أطباق", "تصوير", "انطمس", "تقريظ", "إنسان", "تقطير", "وسائد", "تعزيم", "انفطر", "مبايع", "تهامل", "إمرار", "انصقل", "مشروع", "ماتين", "ترابط", "موضوع"];

        const config = { maxAttempts: 6, wordLength: 5 };
        let state = {
            target: "",
            currentRow: 0,
            currentTile: 0,
            currentGuess: "",
            gameOver: false,
            stats: JSON.parse(localStorage.getItem('wordle_stats_ar_v3')) || { played: 0, wins: 0, streak: 0 }
        };

        function normalize(w) {
            return w.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىئ]/g, 'ي').replace(/ؤ/g, 'و');
        }

        function initGame() {
            // اختيار كلمة اليوم بناءً على التاريخ
            const dayOffset = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
            state.target = TARGETS[dayOffset % TARGETS.length];
            
            // بناء الشبكة
            const grid = document.getElementById('grid');
            for(let i=0; i<config.maxAttempts; i++) {
                const row = document.createElement('div');
                row.className = "flex gap-2";
                row.id = `row-${i}`;
                for(let j=0; j<config.wordLength; j++) {
                    const tile = document.createElement('div');
                    tile.id = `tile-${i}-${j}`;
                    tile.className = "tile border-2 border-[#3a3a3c]";
                    row.appendChild(tile);
                }
                grid.appendChild(row);
            }

            // بناء الكيبورد
            const kbLayout = [
                "ضصثقفغعهخحج",
                "شسيبلاتنمكط",
                "دذرزوؤءئىة"
            ];
            const kb = document.getElementById('keyboard');
            kbLayout.forEach((line, idx) => {
                const row = document.createElement('div');
                row.className = "flex justify-center gap-1 mb-2";
                if(idx === 2) {
                    const enter = createKey("تأكيد", "Enter", "px-4 sm:px-6 text-xs");
                    row.appendChild(enter);
                }
                [...line].forEach(char => row.appendChild(createKey(char, char, "flex-1")));
                if(idx === 2) {
                    const del = createKey("⌫", "Backspace", "px-4 sm:px-6");
                    row.appendChild(del);
                }
                kb.appendChild(row);
            });

            document.addEventListener('keydown', (e) => handleInput(e.key));
            document.getElementById('statsBtn').onclick = showStats;
            document.getElementById('closeModal').onclick = () => document.getElementById('modal').classList.add('hidden');
            document.getElementById('shareBtn').onclick = shareResult;
        }

        function createKey(label, val, extraClass) {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.className = `key ${extraClass}`;
            btn.dataset.key = val;
            btn.onclick = () => handleInput(val);
            return btn;
        }

        function handleInput(key) {
            if(state.gameOver) return;

            if(key === 'Enter') {
                submitGuess();
            } else if (key === 'Backspace' || key === 'Delete') {
                if(state.currentGuess.length > 0) {
                    state.currentGuess = state.currentGuess.slice(0, -1);
                    updateGrid();
                }
            } else if (state.currentGuess.length < config.wordLength) {
                if(/^[\u0600-\u06FF]$/.test(key)) {
                    state.currentGuess += key;
                    updateGrid();
                    const tile = document.getElementById(`tile-${state.currentRow}-${state.currentGuess.length-1}`);
                    tile.classList.add('pop');
                    setTimeout(() => tile.classList.remove('pop'), 100);
                }
            }
        }

        function updateGrid() {
            for(let j=0; j<config.wordLength; j++) {
                const tile = document.getElementById(`tile-${state.currentRow}-${j}`);
                tile.textContent = state.currentGuess[j] || "";
            }
        }

        function showToast(msg) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.classList.remove('hidden');
            setTimeout(() => t.classList.add('hidden'), 2000);
        }

        function submitGuess() {
            const guess = state.currentGuess;
            if(guess.length < config.wordLength) {
                showToast("الكلمة قصيرة جداً");
                shakeRow();
                return;
            }

            // التحقق من وجود الكلمة في قاموس المحاولات
            const normalizedGuess = normalize(guess);
            const exists = DICTIONARY.some(w => normalize(w) === normalizedGuess);
            
            if(!exists) {
                showToast("الكلمة غير موجودة في القاموس");
                shakeRow();
                return;
            }

            revealGuess();
        }

        function shakeRow() {
            const row = document.getElementById(`row-${state.currentRow}`);
            row.classList.add('shake');
            setTimeout(() => row.classList.remove('shake'), 500);
        }

        function revealGuess() {
            const guess = state.currentGuess;
            const target = state.target;
            const normGuess = normalize(guess);
            const normTarget = normalize(target);
            
            const results = Array(5).fill('absent');
            const targetCharCount = {};

            // حساب تكرار الحروف في الكلمة الهدف
            [...normTarget].forEach(c => targetCharCount[c] = (targetCharCount[c] || 0) + 1);

            // المرحلة الأولى: اللون الأخضر
            for(let i=0; i<5; i++) {
                if(normGuess[i] === normTarget[i]) {
                    results[i] = 'correct';
                    targetCharCount[normGuess[i]]--;
                }
            }

            // المرحلة الثانية: اللون الأصفر
            for(let i=0; i<5; i++) {
                if(results[i] !== 'correct' && targetCharCount[normGuess[i]] > 0) {
                    results[i] = 'present';
                    targetCharCount[normGuess[i]]--;
                }
            }

            // التحريك والتلوين
            for(let i=0; i<5; i++) {
                const tile = document.getElementById(`tile-${state.currentRow}-${i}`);
                setTimeout(() => {
                    tile.classList.add('flip');
                    setTimeout(() => {
                        tile.classList.add(results[i]);
                        updateKeyboard(guess[i], results[i]);
                    }, 300);
                }, i * 150);
            }

            state.currentRow++;
            const won = normGuess === normTarget;
            
            setTimeout(() => {
                if(won) {
                    endGame(true);
                } else if (state.currentRow === config.maxAttempts) {
                    endGame(false);
                }
                state.currentGuess = "";
            }, 1500);
        }

        function updateKeyboard(char, status) {
            const key = document.querySelector(`.key[data-key="${char}"]`);
            if(!key) return;
            if(status === 'correct') {
                key.classList.remove('present', 'absent');
                key.classList.add('correct');
            } else if (status === 'present' && !key.classList.contains('correct')) {
                key.classList.add('present');
            } else if (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
                key.classList.add('absent');
            }
        }

        function endGame(win) {
            state.gameOver = true;
            state.stats.played++;
            if(win) {
                state.stats.wins++;
                state.stats.streak++;
                showToast("رائع! تخمين عبقري");
            } else {
                state.stats.streak = 0;
                showToast(`الكلمة كانت: ${state.target}`);
            }
            localStorage.setItem('wordle_stats_ar_v3', JSON.stringify(state.stats));
            setTimeout(showStats, 2000);
        }

        function showStats() {
            document.getElementById('playedCount').textContent = state.stats.played;
            document.getElementById('winPercent').textContent = Math.round((state.stats.wins/state.stats.played)*100) || 0;
            document.getElementById('streakCount').textContent = state.stats.streak;
            document.getElementById('modal').classList.remove('hidden');
        }

        function shareResult() {
            const text = `لعبة كلمة 🧩\nالنتيجة: ${state.gameOver && state.stats.streak > 0 ? state.currentRow : 'X'}/6\n#كلمة_العربية`;
            navigator.clipboard.writeText(text);
            showToast("تم نسخ النتيجة لمشاركتها");
        }

        window.onload = initGame;
    </script>
</body>
</html>
