export const CLIENT_APP = `
        // --- Analytics Tracking ---
        function sendAnalyticsPing() {
            let analyticsId = localStorage.getItem('analytics_id');
            if (!analyticsId) {
                // Generate a random UUID-like string
                analyticsId = crypto.randomUUID ? crypto.randomUUID() : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('analytics_id', analyticsId);
            }

            fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: analyticsId })
            }).catch(e => console.error('Analytics ping failed', e));
        }
        
        // Execute immediately on load
        sendAnalyticsPing();
        // --------------------------

        function initApp(d, isOffline) {
                    fullData = d;
                    cleanupNotes();
                    
                    // Sync UI for the initial week selection
                    const btnActual = document.getElementById('btn-actual');
                    const btnNext = document.getElementById('btn-next');
                    if (btnActual) btnActual.classList.toggle('active', selectedWeek === 'actual');
                    if (btnNext) btnNext.classList.toggle('active', selectedWeek === 'next');

                    const syncTimeEl = document.getElementById('sync-time');
                    const entityData = d[selectedId.toLowerCase()] || (d.selectedEntity && d.selectedEntity.id === selectedId ? d.selectedEntity.data : null);
                    
                    const lastCheck = d.lastChecked || (entityData ? entityData.actual.timestamp : '--:--');
                    const lastChange = entityData ? entityData.actual.timestamp : lastCheck;
                    
                    syncTimeEl.innerHTML = \`
                        <div style="margin-bottom: 2px;">Posledn\xED zm\u011Bna: <b>\${lastChange}</b></div>
                        <div>Posledn\xED kontrola: \${lastCheck}</div>
                    \`;
                    
                    if (isOffline) {
                        syncTimeEl.innerHTML += ' <span style="color:#f44336;">(Offline)</span>';
                    }
                    
                    const debugEl = document.getElementById('debug-bar');
                    if (debugEl) {
                        let info = 'Scraper: ' + (d.debug || "No info");
                        if (d.menu) {
                            info += ' | Keys: ' + Object.keys(d.menu).slice(0, 5).join(', ') + '...';
                        }
                        debugEl.textContent = info;
                    }
                    
                    // Call updateFilterUI to ensure selection buttons are correct
                    updateFilterUI();
                    updateNotifBtn();
                    applyTheme();
                    initSensitivityUI();
                    
                    // Initial render
                    initDaySelector();
                    render();
            }

        const cachedData = localStorage.getItem('timetableCache');

        if (window.__INITIAL_DATA__) {
            console.log('Using injected initial data');
            initApp(window.__INITIAL_DATA__, false);
            localStorage.setItem('timetableCache', JSON.stringify(window.__INITIAL_DATA__));
            initialAppLoaded = true;
        } else if (cachedData) {
            try { 
                initApp(JSON.parse(cachedData), true); 
                initialAppLoaded = true;
            } catch(e) {}
        }
        
        // Only fetch if we haven't loaded anything yet or to ensure we have the absolute latest
        const fetchUrl = '/api/timetable?type=' + selectedType + '&id=' + selectedId;
        
        fetch(fetchUrl)
        .then(r => {
            if (!r.ok) throw new Error('Chyba s\xEDt\u011B');
            return r.json();
        })
        .then((d) => {
            const currentCache = localStorage.getItem('timetableCache');
            if (!initialAppLoaded || JSON.stringify(d) !== currentCache) {
                console.log('Z\xEDsk\xE1na nejnov\u011Bj\u0161\xED data');
                localStorage.setItem('timetableCache', JSON.stringify(d));
                initApp(d, false);
            } else {
                updateFilterUI();
                render();
            }
        })
        .catch(err => {
            console.error('Fetch failed', err);
            if (!initialAppLoaded) {
                const app = document.getElementById('app');
                if (app) app.innerHTML = '<div style="padding:20px; text-align:center; color:#f44336;">Nelze na\u010D\xEDst data. Zkontrolujte p\u0159ipojen\xED.</div>';
            }
        });

        // Service Worker Registrace
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log('SW registered');
            }).catch(err => {
                console.error('SW registration failed:', err);
            });
        }
        

        // Get touch start and end positions and swiping

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, {passive: true});

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, {passive: true});

        function handleSwipe() {
            if (!fullData || !selectedDay) return;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Swipe from top to bottom (pull down) at the top of the page to reload
            if (diffY < -60 && Math.abs(diffX) < 150 && touchStartY < 250) {
                if (window.scrollY <= 20) {
                    const spinner = document.getElementById('pull-spinner');
                    if (spinner) spinner.style.display = 'flex';
                    
                    if (navigator.onLine) {
                        // Jsme online - zkus\xEDme natvrdo st\xE1hnout nejnov\u011Bj\u0161\xED data a SW
                        console.log("Pull-to-refresh: Online reset...");
                        
                        // 1. Unregister SW, aby se p\u0159\xED\u0161t\u011B na\u010Detla \u010Derstv\xE1 verze
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistrations().then(registrations => {
                                for(let registration of registrations) {
                                    registration.unregister();
                                }
                            });
                        }
                        
                        // 2. Fetch dat p\u0159ed reloadem (aby se naplnila cache)
                        const fetchUrl = '/api/timetable?type=' + selectedType + '&id=' + selectedId;
                        fetch(fetchUrl)
                            .then(r => r.json())
                            .then(d => {
                                localStorage.setItem('timetableCache', JSON.stringify(d));
                                window.location.reload(true); // reload z webu
                            })
                            .catch(() => window.location.reload(true));
                    } else {
                        // Offline - jen b\u011B\u017En\xFD reload (pou\u017Eije se cache z SW)
                        console.log("Pull-to-refresh: Offline reload...");
                        setTimeout(() => window.location.reload(), 300);
                    }
                }
                return;
            }

            const diff = diffX;
            if (Math.abs(diff) < swipeSensitivity) return; // Use dynamic sensitivity

            // Use all 5 working days for navigation to match initDaySelector
            const sortedDays = daysOrder;
            let idx = sortedDays.indexOf(selectedDay);
            
            if (idx === -1) return;

            if (diff > 0) {
                // Swiped left -> Next day
                if (idx < sortedDays.length - 1) {
                    setDay(sortedDays[idx + 1]);
                } else if (selectedWeek === 'actual') {
                    setWeek('next');
                    setDay(sortedDays[0]);
                }
            } else {
                // Swiped right -> Previous day
                if (idx > 0) {
                    setDay(sortedDays[idx - 1]);
                } else if (selectedWeek === 'next') {
                    setWeek('actual');
                    setDay(sortedDays[sortedDays.length - 1]);
                }
            }
        }

        // Auto-refresh logic
        setInterval(() => {
            if (document.hidden) return; // Pocket Mode: Ned\u011Blat nic, pokud je tab skryt\xFD
            
            processNow(); // Aktualizuje banner a notifikace
            
            // Ka\u017Ed\xFDch 10 minut si aplikace sama "\u0161\xE1hne" pro \u010Derstv\xE1 data ze serveru (Edge Cache)
            if (getNow().getMinutes() % 10 === 0) { 
                console.log("Automatick\xFD re-fetch dat...");
                const fetchUrl = '/api/timetable?type=' + selectedType + '&id=' + selectedId;
                fetch(fetchUrl).then(r => r.json()).then(d => {
                    const currentCache = localStorage.getItem('timetableCache');
                    if (JSON.stringify(d) !== currentCache) {
                        localStorage.setItem('timetableCache', JSON.stringify(d));
                        initApp(d, false);
                    }
                }).catch(e => console.error("Auto-fetch failed", e));
            }
        }, 60000);
`;