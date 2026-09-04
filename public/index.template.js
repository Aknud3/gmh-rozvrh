import { CSS_STYLES } from './css/style.js';
import { CLIENT_STATE } from './js/client-state.js';
import { CLIENT_UI } from './js/client-ui.js';
import { CLIENT_RENDER } from './js/client-render.js';
import { CLIENT_APP } from './js/client-app.js';
import { CLIENT_ONBOARDING } from './js/onboarding.js';

export const FULL_CLIENT_JS = CLIENT_STATE + CLIENT_UI + CLIENT_RENDER + CLIENT_APP + CLIENT_ONBOARDING;

export const getFullHtml = (scriptContent) => `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gymn\xE1zium Mnichovo Hradi\u0161t\u011B - Rozvrh</title>
    <meta name="theme-color" id="theme-meta" content="#1976D2">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="GMH Rozvrh" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="icon" type="image/png" href="/assets/favicon-96x96.png?v=2" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg?v=2" />
    <link rel="shortcut icon" href="/assets/favicon.ico?v=2" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png?v=2" />
    <meta name="apple-mobile-web-app-title" content="GMH Rozvrh" />
    <link rel="manifest" href="/assets/site.webmanifest?v=2" />
    <style>
        ${CSS_STYLES}
    </style>
</head>
<body ontouchstart="">
    <div id="pull-spinner">
        <div class="spinner-circle"></div>
    </div>
    <div id="now-banner" onclick="triggerManualNotification()" style="cursor: pointer;"></div>
    <header>
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <h1 id="header-date" style="font-weight: 800; letter-spacing: -0.5px; font-size: 18px; margin: 0;">Na\u010D\xEDt\xE1n\xED...</h1>
            <span id="header-entity" style="font-size: 10px; opacity: 0.8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">Rozvrh</span>
        </div>
        <button id="settings-btn" class="btn-ui" onclick="openSettings()" style="display: flex; align-items: center; justify-content: center; padding: 6px 10px; background: rgba(25, 118, 210, 0.2); border: none; border-radius: 6px; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
    </header>

    <div class="tab-bar">
        <button class="tab-btn active" id="btn-actual" onclick="setWeek('actual')">TENTO T\xDDDEN</button>
        <button class="tab-btn" id="btn-next" onclick="setWeek('next')">P\u0158\xCD\u0160T\xCD T\xDDDEN</button>
    </div>
    
    <div id="day-selector"></div>
    
    <main id="app"></main>

    <div id="debug-bar" style="display:none; font-size:0.6rem; color:var(--text-dim); padding:5px; background:rgba(0,0,0,0.05); word-break:break-all;"></div>
    <div id="status-bar" style="display:none; justify-content:space-between; align-items:center; border-top: 1px solid var(--border);">
        <span id="sync-time" onclick="toggleDebug()" style="cursor:pointer;"></span>
    </div>

    <footer>made by Eduard Wojnar <a href="/LICENSE" style="color: inherit; text-decoration: none; opacity: 0.8;">(MIT License)</a></footer>

    <!-- Settings Modal -->
    <div class="modal-overlay" id="modal-overlay" onclick="closeSettings()"></div>
    <div class="modal-content" id="settings-modal" style="padding: 20px 0;">
        <span class="close-modal" onclick="closeSettings()">&times;</span>
        <h2 id="settings-title-text" style="margin: 0 16px 5px 16px; font-weight: 800;">Nastaven\xED</h2>
        <div id="settings-sync-info" style="margin: 0 16px 20px 16px; font-size: 0.8rem; color: var(--text-dim); font-weight: 500;"></div>
        
        <div class="settings-section">
            <div class="settings-title">Vzhled a Ozn\xE1men\xED</div>
            <div class="settings-row">
                <button id="theme-btn" class="tab-btn" onclick="toggleTheme()" style="border: 1px solid var(--border); min-width: 60px;">\u{1F319} Re\u017Eim</button>
                <button id="notif-btn" class="tab-btn" onclick="toggleNotifications()" style="border: 1px solid var(--border); min-width: 60px;">\u{1F514} Ozn\xE1men\xED</button>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-title">Obecn\xE9</div>
            <div class="ios-group" style="margin: 0 16px;">
                <div class="ios-row" onclick="openRozvrhSubmenu()" style="cursor: pointer;">
                    <span style="font-weight: 500;">\u{1F4D6} Rozvrh</span>
                    <span style="color: var(--text-dim);">\u276F</span>
                </div>
                <div class="ios-row" onclick="openColorsSubmenu()" style="cursor: pointer;">
                    <span style="font-weight: 500;">\u{1F3A8} Vlastn\xED barvy</span>
                    <span style="color: var(--text-dim);">\u276F</span>
                </div>
                <div class="ios-row" onclick="openAbsenceSubmenu()" style="cursor: pointer;">
                    <span style="font-weight: 500;">\u{1F436} Hl\xEDd\xE1n\xED absence</span>
                    <span style="color: var(--text-dim);">\u276F</span>
                </div>
                <div class="ios-row" onclick="openNotesSubmenu()" style="cursor: pointer;">
                    <span style="font-weight: 500;">\u{1F4DD} Pozn\xE1mky</span>
                    <span style="color: var(--text-dim);">\u276F</span>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-title">Citlivost gest</div>
            <div class="settings-row" style="padding: 15px; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2rem;" title="Vysok\xE1 citlivost">\u26A1</span>
                <input type="range" id="swipe-sensitivity" min="50" max="300" step="10" 
                       style="flex: 1; height: 8px; border-radius: 4px; appearance: none; background: var(--border); outline: none; accent-color: var(--primary);" 
                       oninput="updateSensitivityDisplay(this.value)" 
                       onchange="saveSensitivity(this.value)">
                <span style="font-size: 1.2rem;" title="N\xEDzk\xE1 citlivost">\u{1F40C}</span>
                <div id="sensitivity-value" style="display:none;"></div>
            </div>
        </div>

        <div class="settings-section" style="margin-top: 30px; padding: 0 16px;">
            <button onclick="refreshAppData()" style="width: 100%; padding: 14px; background: rgba(25, 118, 210, 0.1); color: var(--primary); border: 1px solid rgba(25, 118, 210, 0.3); border-radius: 12px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; margin-bottom: 12px;">
                AKTUALIZOVAT DATA
            </button>
            <button onclick="clearAppCache()" style="width: 100%; padding: 14px; background: rgba(244, 67, 54, 0.1); color: #f44336; border: 1px solid rgba(244, 67, 54, 0.3); border-radius: 12px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;">
                RESET APLIKACE 
            </button>
            <p style="text-align: center; font-size: 0.75rem; color: var(--text-dim); margin-top: 10px; line-height: 1.4;">
                Prvn\xED tla\u010D\xEDtko jen vynut\xED sta\u017Een\xED nov\xE9ho rozvrhu a nejnov\u011Bj\u0161\xED verze aplikace. Druh\xE9 sma\u017Ee \xFApln\u011B v\u0161e.
            </p>
        </div>
    </div>

    <!-- Notes Sub-menu Modal -->
    <div class="modal-overlay" id="notes-submenu-overlay" onclick="closeNotesSubmenu()"></div>
    <div class="modal-content" id="notes-submenu-modal" style="padding: 20px 0;">
        <span class="close-modal" onclick="closeNotesSubmenu()">\u2190</span>
        <h2 id="notes-submenu-title" style="margin: 0 16px 15px 16px; font-weight: 800;">Pozn\xE1mky</h2>
        
        <div id="note-form-container" style="margin: 0 16px 25px 16px; padding-bottom: 20px; border-bottom: 2px solid var(--border);">
            <div class="ios-group">
                <div class="ios-row">
                    <span style="font-weight: 500;">Datum</span>
                    <input type="date" id="note-date" style="border: none; background: transparent; color: var(--text); font-family: inherit; font-size: 1rem; text-align: right; outline: none;">
                </div>
                <div class="ios-row">
                    <span style="font-weight: 500;">P\u0159edm\u011Bt</span>
                    <input type="text" id="note-subject" placeholder="Napi\u0161te p\u0159edm\u011Bt..." style="border: none; background: transparent; color: var(--text); font-family: inherit; font-size: 1rem; text-align: right; outline: none; flex: 1; padding-left: 20px;">
                </div>
                <div class="ios-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
                    <span style="font-weight: 500;">Pozn\xE1mka</span>
                    <textarea id="note-text" placeholder="Co si chcete pamatovat?" style="border: none; background: transparent; color: var(--text); font-family: inherit; font-size: 1rem; outline: none; resize: none; height: 80px; padding: 0;"></textarea>
                </div>
                <div class="ios-row">
                    <span style="font-weight: 500;">Test</span>
                    <label class="ios-switch">
                        <input type="checkbox" id="note-is-test">
                        <span class="ios-slider"></span>
                    </label>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="tab-btn active" id="save-note-btn" onclick="saveNote()" style="flex: 2; padding: 12px; border-radius: 12px; font-size: 1rem;">P\u0158IDAT</button>
                <button class="tab-btn" id="cancel-edit-btn" onclick="resetNoteForm()" style="flex: 1; display: none; padding: 12px; border-radius: 12px; font-size: 1rem; background: var(--tab-bg); color: var(--text-dim);">ZRU\u0160IT</button>
            </div>
        </div>

        <div id="notes-list-ui" style="margin: 0 16px;"></div>
    </div>

    <!-- Colors Sub-menu Modal -->
    <div class="modal-overlay" id="colors-submenu-overlay" onclick="closeColorsSubmenu()"></div>
    <div class="modal-content" id="colors-submenu-modal" style="padding: 20px 0;">
        <span class="close-modal" onclick="closeColorsSubmenu()">\u2190</span>
        <h2 style="margin: 0 16px 15px 16px; font-weight: 800;">Barvy</h2>
        
        <div class="settings-section">
            <div class="settings-title">Hlavn\xED barva</div>
            <div class="ios-group" style="margin: 0 16px;">
                <div class="ios-row">
                    <span style="font-weight: 500;">Hlavn\xED t\xE9ma</span>
                    <input type="color" id="primary-color-picker" style="border:none; padding:0; background:none; width:30px; height:30px; cursor:pointer; border-radius:5px;" oninput="savePrimaryColor(this.value)">
                </div>
            </div>
        </div>

        <div class="settings-section">
            <div class="settings-title">Pauzy</div>
            <div id="breaks-color-ui" style="margin: 0 16px;"></div>
        </div>

        <div class="settings-section">
            <div class="settings-title">Barvy p\u0159edm\u011Bt\u016F</div>
            <div id="color-palette-ui" style="margin: 0 16px;"></div>
        </div>
    </div>

    <!-- Absence Sub-menu Modal -->
    <div class="modal-overlay" id="absence-submenu-overlay" onclick="closeAbsenceSubmenu()"></div>
    <div class="modal-content" id="absence-submenu-modal" style="padding: 20px 0;">
        <span class="close-modal" onclick="closeAbsenceSubmenu()">\u2190</span>
        <h2 style="margin: 0 16px 15px 16px; font-weight: 800;">Hl\xEDd\xE1n\xED absence \u{1F436}</h2>
        <div style="margin: 0 16px 20px 16px; font-size: 0.85rem; color: var(--text-dim); line-height: 1.4;">
            Zadejte aktu\xE1ln\xED stav z Bakal\xE1\u0159\u016F (nap\u0159. 2 / 10). Aplikace v\xE1s upozorn\xED, pokud absence p\u0159ekro\u010D\xED 20 %.
        </div>
        
        <div class="settings-section">
            <div class="settings-title">Konfigurace p\u0159edm\u011Bt\u016F</div>
            <div id="absence-config-ui" style="margin: 0 16px;"></div>
        </div>
    </div>

    <!-- Rozvrh Sub-menu Modal (Class + Groups) -->
    <div class="modal-overlay" id="rozvrh-submenu-overlay" onclick="closeRozvrhSubmenu()"></div>
    <div class="modal-content" id="rozvrh-submenu-modal" style="padding: 20px 0;">
        <span class="close-modal" onclick="closeRozvrhSubmenu()">\u2190</span>
        <h2 style="margin: 0 16px 15px 16px; font-weight: 800;">Rozvrh</h2>
        <div id="filter-ui"></div>
    </div>

    <!-- Lesson Detail Modal -->
    <div class="modal-overlay" id="detail-overlay" onclick="closeDetail()"></div>
    <div class="modal-content" id="detail-modal">
        <span class="close-modal" onclick="closeDetail()">&times;</span>
        <div id="detail-body"></div>
    </div>

    <button class="fab-btn" id="add-note-btn" onclick="openNoteModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>

    <script>
        ${scriptContent}
    <\/script>
</body>
</html>
`;
