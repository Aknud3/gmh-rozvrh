
export const CSS_STYLES = `
    :root { 
            --primary: #1976D2; --accent: #FFC107; --bg: #eceff1; --card: #ffffff; 
            --text: #263238; --text-dim: #546e7a; --now-bg: #4caf50; --break-bg: #ffa000; 
            --tab-bg: #f5f5f5; --tab-active: #546e7a; --border: #cfd8dc; --grid-hour: #78909c;
        }
        body.dark-mode { 
            --bg: #121212; --card: #1e1e1e; --text: #e0e0e0; --text-dim: #b0bec5; 
            --tab-bg: #2c2c2c; --tab-active: #1976D2; --border: #333; --grid-hour: #90a4ae;
        }
        body { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--text); display: flex; flex-direction: column; min-height: 100vh; transition: background 0.3s, color 0.3s; }
        
        /* Remove 300ms tap delay on interactive elements */
        a, button, input, select, textarea, .tab-btn, .day-btn, .lesson-card, .ios-row, .btn-ui, #now-banner, .modal-overlay, .close-modal {
            touch-action: manipulation;
            -webkit-tap-highlight-color: rgba(0,0,0,0);
        }
        
        .tab-btn:active, .day-btn:active, .btn-ui:active, .lesson-card:active {
            opacity: 0.7 !important;
            transition: opacity 0.1s ease !important;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        ::-webkit-scrollbar { display: none; }
        /* Hide scrollbar for IE, Edge and Firefox */
        * { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        #pull-spinner {
            display: none;
            justify-content: center;
            padding: 20px 0;
            background: transparent;
        }
        .spinner-circle {
            width: 26px;
            height: 26px;
            border: 3px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        #now-banner { background: var(--now-bg); color: white; padding: 15px; display: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; overflow: hidden; }
        .progress-bar { position: absolute; top: 0; left: 0; height: 100%; background: rgba(0,0,0,0.3); transition: width 1s linear; z-index: 0; }
        #now-banner.is-break { background: var(--break-bg); border-bottom-color: var(--now-bg); }
        #now-banner.is-split { padding: 0; background: transparent; display: flex; flex-direction: row; }
        #now-banner.is-split .banner-half:first-child { background: var(--now-bg); }
        #now-banner.is-split .banner-half:last-child { background: var(--break-bg); }
        
        .banner-content { text-align: center; width: 100%; position: relative; z-index: 1; }
        .banner-split { display: flex; width: 100%; position: relative; z-index: 1; }
        .banner-half { flex: 1; padding: 15px; position: relative; z-index: 1; }
        .banner-half:first-child { border-right: 1px solid rgba(255,255,255,0.3); }
        
        .banner-label { font-size: 0.75rem; text-transform: uppercase; font-weight: bold; opacity: 0.9; margin-bottom: 4px; }
        .banner-subject { font-size: 1.3rem; font-weight: 800; line-height: 1.2; }
        .banner-details { font-size: 0.9rem; margin-top: 2px; }

        header { 
            background: rgba(25, 118, 210, 0.85); 
            color: white; 
            padding: 12px 15px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            position: sticky;
            top: 0;
            z-index: 10;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        h1 { margin: 0; font-size: 1.1rem; }
        .tab-bar { display: flex; background: var(--card); padding: 5px; border-bottom: 1px solid var(--border); gap: 5px; }
        .tab-btn { flex: 1; padding: 10px; border: none; background: var(--tab-bg); border-radius: 999px; cursor: pointer; font-weight: bold; color: var(--text); }
        .tab-btn.active { background: var(--primary); color: white; }
        #day-selector { 
            display: flex; 
            background: var(--card); 
            padding: 10px; 
            gap: 8px; 
            position: sticky; 
            top: 0; 
            z-index: 5; 
            border-bottom: 1px solid var(--border);
            justify-content: space-around;
        }
        .day-btn { 
            flex: 1; 
            height: 44px; /* HIG minimum tappable area */
            display: flex;
            align-items: center;
            justify-content: center;
            border: none; 
            background: var(--tab-bg); 
            border-radius: 999px; 
            font-weight: 700; 
            color: var(--text); 
            font-size: 1rem;
            transition: all 0.2s;
        }
        .day-btn.active { background: var(--primary); color: white; }

        /* Animations */
        @keyframes slideInRight {
            from { transform: translateX(30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
            from { transform: translateX(-30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes crossFadeScale {
            from { transform: scale(0.98); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .grid-container {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .grid-container.slide-right { animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .grid-container.slide-left { animation: slideInLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .grid-container.fade-scale { animation: crossFadeScale 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

        .lesson-card { 
            background: var(--card); 
            border-radius: 16px; 
            display: flex; 
            align-items: stretch; 
            overflow: hidden; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border: 1px solid var(--border);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            min-height: 70px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            opacity: 0; /* Start hidden for staggered animation */
            animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .lesson-card:active { 
            opacity: 0.8 !important; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important; 
        }
        
        #settings-btn svg { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        #settings-btn:active svg { transform: rotate(90deg); }
        
        .card-hour-box { 
            width: 50px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 1.5rem; 
            font-weight: 900; 
            color: white; 
            background: var(--grid-hour);
            flex-shrink: 0;
        }
        
        .card-main { 
            flex: 1; 
            padding: 12px 16px; 
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .card-times { 
            display: flex; 
            flex-direction: column; 
            font-size: 0.85rem; 
            font-weight: 600; 
            color: var(--text-dim); 
            line-height: 1.3;
            min-width: 50px;
        }
        
        .card-content { 
            flex: 1;
            display: flex; 
            flex-direction: column; 
            gap: 2px;
            min-width: 0; 
        }
        
        .subject-line { 
            font-weight: 800; 
            font-size: 1.15rem; 
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text);
        }
        
        .room-badge {
            font-size: 0.9rem;
            padding: 2px 8px;
            border-radius: 6px;
            background: rgba(0,0,0,0.05);
            color: var(--text);
            font-weight: 800;
        }
        
        body.dark-mode .room-badge { background: rgba(255,255,255,0.1); color: white; }

        .teacher-initials {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--tab-bg);
            color: var(--text-dim);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
            border: 1px solid var(--border);
        }

        .lesson-card.changed { 
            background: #fff5f5; 
            border: 2px solid #f44336; 
        }
        body.dark-mode .lesson-card.changed {
            background: #3e1a1a;
            border-color: #f44336;
        }
        .lesson-card.changed .card-hour-box { background: #f44336 !important; }
        .lesson-card.changed .subject-line span { color: #f44336 !important; }

        /* Detail Modal Styles */
        #detail-modal .modal-content {
            padding: 30px;
            text-align: center;
        }
        .detail-header { font-size: 1.5rem; font-weight: 900; margin-bottom: 10px; }
        .detail-item { margin-bottom: 15px; font-size: 1.1rem; color: var(--text-dim); }
        .detail-label { font-size: 0.8rem; text-transform: uppercase; font-weight: bold; color: var(--primary); margin-bottom: 4px; }

        #status-bar { padding: 10px; text-align: center; font-size: 0.7rem; color: var(--text-dim); }
        .btn-ui { padding: 5px 10px; border-radius: 999px; border: 1px solid white; background: transparent; color: white; cursor: pointer; font-size: 0.8rem; }

        
        /* Modal Styles */
        .modal-overlay { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.4); 
            z-index: 100; 
            display: none; 
            backdrop-filter: blur(10px); 
            -webkit-backdrop-filter: blur(10px);
        }
        .modal-content { position: fixed; bottom: 0; left: 0; width: 100%; background: var(--bg); border-radius: 20px 20px 0 0; z-index: 101; display: none; padding: 20px; box-sizing: border-box; max-height: 90vh; overflow-y: auto; box-shadow: 0 -5px 25px rgba(0,0,0,0.2); transition: transform 0.3s ease-out; transform: translateY(100%); }
        .modal-content.active { transform: translateY(0); }
        .settings-section { margin-bottom: 15px; }
        .settings-title { 
            font-size: 0.75rem; 
            color: var(--text-dim); 
            text-transform: uppercase; 
            padding: 24px 16px 8px 16px; 
            font-weight: 400; 
            letter-spacing: 0.05em; 
        }
        .settings-row { 
            display: flex; 
            gap: 10px; 
            flex-wrap: wrap; 
            margin: 0 16px 10px 16px; 
            background: var(--card);
            padding: 12px;
            border-radius: 10px;
        }
        .close-modal { position: absolute; top: 15px; right: 20px; font-size: 1.5rem; cursor: pointer; color: var(--text-dim); }
        
        /* iOS style settings */
        .ios-group {
            background: var(--card);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        .ios-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
            background: var(--card);
        }
        .ios-row:last-child {
            border-bottom: none;
        }
        .ios-header {
            font-size: 0.75rem;
            color: var(--text-dim);
            text-transform: uppercase;
            padding: 24px 16px 8px 16px;
            font-weight: 400;
            letter-spacing: 0.05em;
        }
        .ios-switch {
            position: relative;
            display: inline-block;
            width: 51px;
            height: 31px;
            flex-shrink: 0;
        }
        .ios-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .ios-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #e9e9eb;
            transition: .4s;
            border-radius: 34px;
        }
        .ios-slider:before {
            position: absolute;
            content: "";
            height: 27px;
            width: 27px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }
        input:checked + .ios-slider {
            background-color: #34c759 !important;
        }
        input:checked + .ios-slider:before {
            transform: translateX(20px);
        }
        body.dark-mode .ios-slider {
            background-color: #39393d;
        }
        body.dark-mode .ios-slider:before {
            background-color: #ffffff;
        }
        
        footer { 
            padding: 10px 20px; 
            text-align: center; 
            font-size: 0.65rem; 
            color: var(--text-dim); 
            opacity: 0.8;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-weight: 600;
            cursor: pointer;
        }

        @media (max-width: 600px) {
            .banner-subject { font-size: 1.1rem; }
            .banner-details { font-size: 0.8rem; }
        }

        /* Notes Styles */
        .fab-btn {
            position: fixed;
            bottom: 25px;
            right: 25px;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 90;
            border: none;
            transition: transform 0.2s;
        }
        .fab-btn:active { opacity: 0.8; }
        
        .note-card {
            background: var(--card);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 12px;
            border-left: 5px solid var(--primary);
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            opacity: 0;
            animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .note-card.is-test {
            border-left-color: #f44336;
            background: #fff5f5;
        }
        body.dark-mode .note-card.is-test {
            background: #3e1a1a;
        }
        .note-card.is-test .note-subject { color: #f44336; }
        
        .note-subject { font-weight: 800; font-size: 0.9rem; margin-bottom: 2px; }
        .note-text { font-size: 0.85rem; color: var(--text); }
        .note-delete { color: var(--text-dim); cursor: pointer; padding: 4px; }

        /* Hl\xEDd\xE1n\xED absence \u{1F436} Styles */
        @keyframes pulse-magma {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
            70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
        .absence-warning {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            z-index: 5;
        }
        .absence-warning.low { background: #4caf50; }
        .absence-warning.medium { background: #ff9800; }
        .absence-warning.high { 
            background: #ff0000; 
            animation: pulse-magma 2s infinite;
            box-shadow: 0 0 5px #ff0000;
        }
        .attendance-panel {
            background: var(--card);
            border-radius: 12px;
            padding: 15px;
            margin-top: 20px;
            border: 1px solid var(--border);
            text-align: left;
        }
        .attendance-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .attendance-percent {
            font-size: 1.5rem;
            font-weight: 800;
        }
        .attendance-percent.low { color: #4caf50; }
        .attendance-percent.medium { color: #ff9800; }
        .attendance-percent.high { color: #ff0000; }
        .attendance-controls {
            display: flex;
            gap: 10px;
        }
        .attendance-btn {
            flex: 1;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--tab-bg);
            color: var(--text);
            font-weight: bold;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .attendance-btn.present { background: #4caf50; color: white; border: none; }
        .attendance-btn.absent { background: #ff0000; color: white; border: none; }
        .debug-line { margin-bottom: 4px; border-bottom: 1px solid #222; padding-bottom: 2px; }
        .debug-label { color: #888; }

        /* Modal Sheet Architecture */
        body.modal-open {
            overflow: hidden !important;
            height: 100vh !important;
            width: 100vw !important;
            position: fixed !important;
        }

        #app-wrapper {
            transition: transform 0.6s cubic-bezier(0.32, 0.72, 0, 1), filter 0.6s ease, border-radius 0.6s ease;
            min-height: 100vh;
            background: var(--bg);
            transform-origin: center top;
            will-change: transform, filter;
        }

        body.modal-open #app-wrapper {
            transform: scale(0.93) translateY(12px);
            filter: brightness(0.5);
            pointer-events: none;
            border-radius: 24px;
            overflow: hidden;
            user-select: none;
        }

        #onboarding-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
            align-items: flex-end;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
        }

        .modal-sheet {
            width: 100%;
            background: #1c1c1e;
            color: white;
            border-radius: 30px 30px 0 0;
            max-height: 94vh;
            display: flex;
            flex-direction: column;
            transform: translateY(100%);
            transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
            box-shadow: 0 -15px 30px rgba(0,0,0,0.5);
        }

        #onboarding-overlay.active .modal-sheet {
            transform: translateY(0);
        }

        .modal-handle {
            width: 40px;
            height: 5px;
            background: rgba(255,255,255,0.25);
            border-radius: 3px;
            margin: 12px auto;
            flex-shrink: 0;
        }

        .scroll-content {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            padding: 10px 24px 60px 24px;
            flex: 1;
        }

        .modal-sheet h1 {
            text-align: center;
            margin: 10px 0 20px 0;
            font-weight: 800;
            font-size: 1.8rem;
            color: white;
        }
`;

