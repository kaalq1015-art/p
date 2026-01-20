<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كلمة | Wordle بالعربي</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        
        body {
            font-family: 'Tajawal', sans-serif;
            background-color: #121213;
            color: white;
            overflow-x: hidden;
        }

        .tile {
            width: 58px;
            height: 58px;
            border: 2px solid #3a3a3c;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            font-weight: bold;
            user-select: none;
            transition: all 0.2s ease;
        }

        @media (max-width: 400px) {
            .tile { width: 50px; height: 50px; font-size: 1.5rem; }
        }

        .tile.active {
            border-color: #565758;
            transform: scale(1.05);
        }

        .tile.correct { background-color: #538d4e; border-color: #538d4e; color: white; }
        .tile.present { background-color: #b59f3b; border-color: #b59f3b; color: white; }
        .tile.absent { background-color: #3a3a3c; border-color: #3a3a3c; color: white; }

        .key {
            background-color: #818384;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.1s;
        }

        .key:active { background-color: #565758; }
        .key.correct { background-color: #538d4e; }
        .key.present { background-color: #b59f3b; }
        .key.absent { background-color: #3a3a3c; }

        @keyframes flip {
            0% { transform: rotateX(0); }
            50% { transform: rotateX(90deg); }
            100% { transform: rotateX(0); }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }

        .flip { animation: flip 0.6s ease-in-out; }
        .shake { animation: shake 0.5s ease-in-out; }
        
        .modal {
            background-color: rgba(0,0,0,0.8);
            backdrop-filter: blur(4px);
        }
    </style>
</head>
<body class="flex flex-col min-h-screen">

    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-2 border-b border-[#3a3a3c]">
        <div class="w-10"></div>
        <h1 class="text-3xl font-bold tracking-wider">كَلِمَة</h1>
        <div class="flex gap-4">
            <button id="statsBtn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
                    <path d="M7 16V10M12 16V7M17 16V13" stroke-width="2"/>
                </svg>
            </button>
        </div>
    </header>

    <!-- Main Game Area -->
    <main class="flex-grow flex items-center justify-center p-2">
        <div id="grid" class="grid grid-rows-6 gap-1.5">
            <!-- Grid rows will be generated here -->
        </div>
    </main>

    <!-- Virtual Keyboard -->
    <div id="keyboard" class="max-w-2xl mx-auto w-full p-2 mb-4">
        <!-- Key rows will be generated here -->
    </div>

    <!-- Message Toast -->
    <div id="toast" class="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-md font-bold hidden shadow-lg"></div>

    <!-- Stats Modal -->
    <div id="modal" class="modal fixed inset-0 z-50 flex items-center justify-center hidden p-4">
        <div class="bg-[#121213] border border-[#3a3a3c] rounded-lg p-8 max-w-sm w-full relative">
            <button id="closeModal" class="absolute top-4 left-4 text-gray-400 hover:text-white text-2xl">✕</button>
            <h2 class="text-center text-xl font-bold mb-6">الإحصائيات</h2>
            <div class="flex justify-around mb-8">
                <div class="text-center"><div id="playedCount" class="text-3xl font-bold">0</div><div class="text-xs">لعب</div></div>
                <div class="text-center"><div id="winPercent" class="text-3xl font-bold">0</div><div class="text-xs">% فوز</div></div>
                <div class="text-center"><div id="currentStreak" class="text-3xl font-bold">0</div><div class="text-xs">متتالي</div></div>
            </div>
            <button id="shareBtn" class="w-full bg-[#538d4e] py-3 rounded-md font-bold text-xl hover:bg-[#4a7d45] transition-colors">
                مشاركة النتيجة
            </button>
        </div>
    </div>

    <script>
        // Dictionary: Pool for Target Words and Validation
        const DICTIONARY = [
            "كتاب", "سماء", "نخيل", "جميل", "طريق", "حياة", "سعيد", "عالم", "صديق", "كبير", 
            "صغير", "قريب", "بعيد", "حديد", "قديم", "جديد", "سريع", "بطيء", "قوي", "ضعيف",
            "بحر", "نهر", "جبل", "قمر", "شمس", "نجم", "ارض", "مطر", "ثلج", "ريح",
            "تفاح", "موز", "عنب", "مانجو", "توت", "خوخ", "رمان", "زيتون", "بصل", "ثوم",
            "اسد", "نمر", "فيل", "حصان", "جمل", "ارنب", "طير", "صقر", "نحل", "نمل",
            "احمر", "ازرق", "اخضر", "اصفر", "ابيض", "اسود", "بني", "وردي", "رماد", "ذهبي",
            "صلاة", "صيام", "زكاة", "حلال", "حرام", "عمرة", "كعبة", "قدوس", "سلام", "مؤمن",
            "مهندس", "طبيب", "معلم", "لاعب", "كاتب", "شاعر", "عامل", "تاجر", "قاضي", "جندي",
            "دولة", "شعب", "وطن", "علم", "نصر", "فوز", "خسر", "لعب", "درس", "كتب"
        ];

        const config = {
            maxAttempts: 6,
            wordLength: 5,
            appId: 'arabic-wordle-pro-v2'
        };

        let state = {
            targetWord: '',
            currentRow: 0,
            currentTile: 0,
            guesses: Array(6).fill(''),
            gameOver: false,
            stats: JSON.parse(localStorage.getItem('wordle_stats_v2')) || { played: 0, wins: 0, streak: 0 }
        };

        function normalize(word) {
            if (!word) return "";
            return word
                .replace(/[أإآ]/g, 'ا')
                .replace(/ة/g, 'ه')
                .replace(/ى/g, 'ي')
                .replace(/ئ/g, 'ي')
                .replace(/ؤ/g, 'و');
        }

        function getDailyWord() {
            const today = new Date();
            const seed = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate();
            // We ensure the word is 5 characters by padding if necessary (though our dictionary should be clean)
            let word = DICTIONARY[seed % DICTIONARY.length];
            return word.padEnd(5, 'ه').substring(0, 5);
        }

        function init() {
            state.targetWord = getDailyWord();
            createGrid();
            createKeyboard();
            setupEventListeners();
        }

        function createGrid() {
            const grid = document.getElementById('grid');
            for (let i = 0; i < config.maxAttempts; i++) {
                const row = document.createElement('div');
                row.id = `row-${i}`;
                row.className = 'grid grid-cols-5 gap-1.5';
                for (let j = 0; j < config.wordLength; j++) {
                    const tile = document.createElement('div');
                    tile.id = `tile-${i}-${j}`;
                    tile.className = 'tile';
                    row.appendChild(tile);
                }
                grid.appendChild(row);
            }
        }

        function createKeyboard() {
            const keyboard = document.getElementById('keyboard');
            const layout = [
                ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
                ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
                ['Enter', 'ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'د', 'ذ', 'Delete']
            ];

            layout.forEach(rowArr => {
                const row = document.createElement('div');
                row.className = 'flex justify-center gap-1.5 mb-2 w-full';
                rowArr.forEach(key => {
                    const btn = document.createElement('button');
                    btn.textContent = key === 'Delete' ? '⌫' : (key === 'Enter' ? 'تأكيد' : key);
                    btn.className = `key h-14 flex items-center justify-center font-bold text-sm sm:text-base ${
                        (key === 'Enter' || key === 'Delete') ? 'px-3 sm:px-5 text-xs bg-[#565758]' : 'flex-1'
                    }`;
                    btn.dataset.key = key;
                    btn.onclick = () => handleInput(key);
                    row.appendChild(btn);
                });
                keyboard.appendChild(row);
            });
        }

        function handleInput(key) {
            if (state.gameOver) return;

            if (key === 'Delete' || key === 'Backspace') {
                if (state.currentTile > 0) {
                    state.currentTile--;
                    const tile = document.getElementById(`tile-${state.currentRow}-${state.currentTile}`);
                    tile.textContent = '';
                    tile.classList.remove('active');
                    state.guesses[state.currentRow] = state.guesses[state.currentRow].slice(0, -1);
                }
            } else if (key === 'Enter') {
                submitGuess();
            } else if (state.currentTile < config.wordLength) {
                // Check if it's an Arabic character
                if (/[\u0600-\u06FF]/.test(key) && key.length === 1) {
                    const tile = document.getElementById(`tile-${state.currentRow}-${state.currentTile}`);
                    tile.textContent = key;
                    tile.classList.add('active');
                    state.guesses[state.currentRow] += key;
                    state.currentTile++;
                }
            }
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 2500);
        }

        function submitGuess() {
            const guess = state.guesses[state.currentRow];
            
            if (guess.length < config.wordLength) {
                showToast("الكلمة قصيرة جداً");
                shakeRow();
                return;
            }

            // Word Validation: Check if word exists in our dictionary (normalized)
            const normalizedGuess = normalize(guess);
            const isValid = DICTIONARY.some(w => normalize(w) === normalizedGuess);
            
            // Note: In real Arwordle, they have a massive dictionary. 
            // Here we check against our pool for demonstration.
            if (!isValid && !DICTIONARY.includes(guess)) {
                showToast("الكلمة غير موجودة في القاموس");
                shakeRow();
                return;
            }

            revealRow(state.currentRow, guess);
        }

        function shakeRow() {
            const row = document.getElementById(`row-${state.currentRow}`);
            row.classList.add('shake');
            setTimeout(() => row.classList.remove('shake'), 500);
        }

        function revealRow(rowIdx, guess) {
            const normalizedGuess = normalize(guess);
            const normalizedTarget = normalize(state.targetWord);
            const tiles = [];
            
            for(let i=0; i<5; i++) tiles.push(document.getElementById(`tile-${rowIdx}-${i}`));

            let targetChars = normalizedTarget.split('');
            let results = Array(5).fill('absent');

            // Pass 1: Correct position
            for (let i = 0; i < 5; i++) {
                if (normalizedGuess[i] === normalizedTarget[i]) {
                    results[i] = 'correct';
                    targetChars[i] = null;
                }
            }

            // Pass 2: Present but wrong position
            for (let i = 0; i < 5; i++) {
                if (results[i] === 'absent' && targetChars.includes(normalizedGuess[i])) {
                    results[i] = 'present';
                    targetChars[targetChars.indexOf(normalizedGuess[i])] = null;
                }
            }

            // Animation and Style update
            tiles.forEach((tile, i) => {
                setTimeout(() => {
                    tile.classList.add('flip');
                    setTimeout(() => {
                        tile.classList.add(results[i]);
                        updateKeyStatus(guess[i], results[i]);
                    }, 300);
                }, i * 150);
            });

            setTimeout(() => {
                if (normalizedGuess === normalizedTarget) {
                    endGame(true);
                } else if (state.currentRow === config.maxAttempts - 1) {
                    endGame(false);
                } else {
                    state.currentRow++;
                    state.currentTile = 0;
                }
            }, 1800);
        }

        function updateKeyStatus(char, status) {
            const keys = document.querySelectorAll(`.key[data-key="${char}"]`);
            keys.forEach(key => {
                if (status === 'correct') {
                    key.classList.remove('present', 'absent');
                    key.classList.add('correct');
                } else if (status === 'present' && !key.classList.contains('correct')) {
                    key.classList.add('present');
                } else if (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
                    key.classList.add('absent');
                }
            });
        }

        function endGame(win) {
            state.gameOver = true;
            state.stats.played++;
            if (win) {
                state.stats.wins++;
                state.stats.streak++;
                setTimeout(() => showToast("أحسنت! تخمين صحيح"), 500);
            } else {
                state.stats.streak = 0;
                setTimeout(() => showToast(`للأسف! الكلمة كانت: ${state.targetWord}`), 500);
            }
            localStorage.setItem('wordle_stats_v2', JSON.stringify(state.stats));
            setTimeout(showStats, 2500);
        }

        function showStats() {
            document.getElementById('playedCount').textContent = state.stats.played;
            const winPct = state.stats.played > 0 ? Math.round((state.stats.wins / state.stats.played) * 100) : 0;
            document.getElementById('winPercent').textContent = winPct;
            document.getElementById('currentStreak').textContent = state.stats.streak;
            document.getElementById('modal').classList.remove('hidden');
        }

        function setupEventListeners() {
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleInput('Enter');
                else if (e.key === 'Backspace') handleInput('Delete');
                else handleInput(e.key);
            });
            
            document.getElementById('statsBtn').onclick = showStats;
            document.getElementById('closeModal').onclick = () => document.getElementById('modal').classList.add('hidden');
            
            document.getElementById('shareBtn').onclick = () => {
                const resultEmoji = state.guesses.slice(0, state.currentRow + 1).map(g => "⬜").join(""); // Placeholder logic
                const text = `لعبة كلمة 🧩\nالنتيجة: ${state.gameOver && state.guesses[state.currentRow] === state.targetWord ? state.currentRow + 1 : 'X'}/6\n#كلمة #Wordle_العربية`;
                navigator.clipboard.writeText(text);
                showToast("تم نسخ النتيجة");
            };
        }

        window.onload = init;
    </script>
</body>
</html>
