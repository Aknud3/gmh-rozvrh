export const CLIENT_STATE = `

        // --- Global State Variables ---

        let fullData = null; // Holds the fetched JSON payload from the worker API
        
        // Entity selection
        let selectedType = localStorage.getItem('selectedType') || 'class'; // 'class' or 'teacher'
        let selectedId = localStorage.getItem('selectedId') || localStorage.getItem('selectedClass') || 'PY';
        
        // Backward compatibility
        let selectedClass = selectedId; 

        let primaryColor = localStorage.getItem('primaryColor') || '#1976D2';
        let nowBannerColor = localStorage.getItem('nowBannerColor') || '#4caf50';
        let nowBannerBreakColor = localStorage.getItem('nowBannerBreakColor') || '#ffa000';
        
        // --- Mockable Time for Testing ---
        window.DEBUG_TIME = new URLSearchParams(window.location.search).get('debug_time');
        if (window.DEBUG_TIME) console.log('DEBUG: Mocked time set to: ' + window.DEBUG_TIME);
        
        window.getNow = function() {
            return window.DEBUG_TIME ? new Date(window.DEBUG_TIME) : new Date();
        };

        // Default to next week on weekends
        const initialNow = getNow();
        const isWeekend = initialNow.getDay() === 0 || initialNow.getDay() === 6;
        let selectedWeek = isWeekend ? 'next' : 'actual';
        let prevWeek = selectedWeek;

        let selectedDay = null;
        let prevDay = null;
        let hiddenGroups = JSON.parse(localStorage.getItem('hiddenGroups') || '[]');
        let subjectColors = JSON.parse(localStorage.getItem('subjectColors') || '{}');
        let absenceData = JSON.parse(localStorage.getItem('absenceData') || '{}');
        let notes = JSON.parse(localStorage.getItem('timetableNotes') || '[]');
        let swipeSensitivity = parseInt(localStorage.getItem('swipeSensitivity') || '100');
        let userName = localStorage.getItem('userName') || 'Host';

        const getMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const daysOrder = ['po','\xFAt','st','\u010Dt','p\xE1'];
        const dayNamesFull = {
            'po': 'Pond\u011Bl\xED',
            '\xFAt': '\xDAtery\u0301',
            'st': 'St\u0159eda',
            '\u010Dt': '\u010Ctvrtek',
            'p\xE1': 'P\xE1tek'
        };

                const HOUR_TIMES = {
            0: "7:00 - 7:50",
            1: "8:00 - 8:45",
            2: "8:55 - 9:40",
            3: "9:55 - 10:40",
            4: "10:50 - 11:35",
            5: "11:45 - 12:30",
            6: "12:35 - 13:20",
            7: "13:25 - 14:10",
            8: "14:15 - 15:00",
            9: "15:05 - 15:50"
        };

        // Notifications state
        let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        let lastNotifiedContent = null;
        let cachedIcon = null;

        // Optimization: Cache for pre-processed lessons to avoid heavy filtering in processNow
        let cachedDayLessons = [];
        let lastProcessedKey = null;

        // Theme state
        let darkMode = localStorage.getItem('darkMode') === 'true' || 
                        (window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('darkMode') === null);

        let initialAppLoaded = false;

        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        // --- Helper Functions ---
        
        function safeMenuHTML(str) {
            if (!str) return "";
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;")
                .replace(/&lt;b&gt;/g, "<b>")
                .replace(/&lt;\\/b&gt;/g, "</b>")
                .replace(/&lt;i&gt;/g, "<i>")
                .replace(/&lt;\\/i&gt;/g, "</i>")
                .replace(/&lt;br\\s*\\/?&gt;/g, "<br>");
        }

        function getInitials(name) {
            if (!name || name === '-') return '?';
            const parts = name.split(' ').filter(p => !p.includes('.') && p.length > 1);
            if (parts.length === 0) return name.charAt(0);
            return parts.map(p => p.charAt(0).toUpperCase()).join('');
        }

        function shouldShowLesson(l) {
            const g = (l.group || "").trim();
            return g === "" || !hiddenGroups.includes(g);
        }
`;
