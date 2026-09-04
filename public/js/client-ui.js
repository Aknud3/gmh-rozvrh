export const CLIENT_UI = `

        function toggleTheme() {
            darkMode = !darkMode;
            localStorage.setItem('darkMode', darkMode);
            applyTheme();
        }

        function applyTheme() {
            document.body.classList.toggle('dark-mode', darkMode);
            const btn = document.getElementById('theme-btn');
            if (btn) btn.textContent = darkMode ? '\u2600\uFE0F Re\u017Eim' : '\u{1F319} Re\u017Eim';
            const meta = document.getElementById('theme-meta');
            if (meta) meta.setAttribute('content', darkMode ? '#121212' : primaryColor);
            
            // Apply global primary color
            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--now-bg', nowBannerColor);
            document.documentElement.style.setProperty('--break-bg', nowBannerBreakColor);
            
            // Update sticky header background to maintain glass effect with new color
            const header = document.querySelector('header');
            if (header) {
                // Convert hex to rgba for transparency if possible, or just use the color
                header.style.backgroundColor = primaryColor + 'D9'; // Adding 85% alpha (D9 in hex)
            }
        }
        
        function openSettings() {
            document.getElementById('modal-overlay').style.display = 'block';
            const modal = document.getElementById('settings-modal');
            modal.style.display = 'block';
            
            // Set user name as title
            const titleEl = document.getElementById('settings-title-text');
            if (titleEl) titleEl.textContent = 'V\xEDtejte v nastaven\xED, ' + userName + '!';

            // Set sync info
            const syncEl = document.getElementById('settings-sync-info');
            if (syncEl && fullData) {
                const now = getNow();
                const day = now.getDate();
                const month = now.getMonth() + 1;
                const timeStr = fullData.lastChecked || '--:--';
                syncEl.textContent = 'Posledn\xED synchronizovan\xE1 data: ' + timeStr + ' | ' + day + '.' + month;
            }

            setTimeout(() => modal.classList.add('active'), 10);
            initSensitivityUI();
        }

        function closeSettings() {
            const modal = document.getElementById('settings-modal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('modal-overlay').style.display = 'none';
            }, 300);
        }
        
        function openRozvrhSubmenu() {
            document.getElementById('rozvrh-submenu-overlay').style.display = 'block';
            const modal = document.getElementById('rozvrh-submenu-modal');
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('active'), 10);
            updateFilterUI();
        }

        function closeRozvrhSubmenu() {
            const modal = document.getElementById('rozvrh-submenu-modal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('rozvrh-submenu-overlay').style.display = 'none';
            }, 300);
        }
        
        function openColorsSubmenu() {
            document.getElementById('colors-submenu-overlay').style.display = 'block';
            const modal = document.getElementById('colors-submenu-modal');
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('active'), 10);
            
            // Set primary color picker value
            document.getElementById('primary-color-picker').value = primaryColor;
            updateColorPaletteUI();
        }

        function closeColorsSubmenu() {
            const modal = document.getElementById('colors-submenu-modal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('colors-submenu-overlay').style.display = 'none';
            }, 300);
        }
    
        function updateColorPaletteUI() {
            const ui = document.getElementById('color-palette-ui');
            const breaksUi = document.getElementById('breaks-color-ui');
            if (!ui || !breaksUi || !fullData) return;
            ui.innerHTML = '';
            breaksUi.innerHTML = '';
            
            const subjectsSet = new Set();
            const idLower = selectedId.toLowerCase();
            const entityData = fullData[idLower];
            if (entityData) {
                ['actual', 'next'].forEach(wk => {
                    if (entityData[wk] && entityData[wk].items) {
                        entityData[wk].items.forEach(i => {
                            if (i.subject && shouldShowLesson(i)) {
                                let s = i.subject;
                                if (s.includes('Ob\u011Bd')) s = 'Ob\u011Bd';
                                subjectsSet.add(s);
                            }
                        });
                    }
                });
            }

            const subjects = Array.from(subjectsSet).sort((a, b) => a.localeCompare(b, 'cs'));
            
            // Helper to create a row
            const createColorRow = (s) => {
                const row = document.createElement('div');
                row.className = 'ios-row';
                
                const label = document.createElement('span');
                label.textContent = s;
                label.style.fontWeight = '500';
                
                const picker = document.createElement('input');
                picker.type = 'color';
                
                let currentColor = subjectColors[s];
                if (!currentColor) {
                   currentColor = getSubjectColor(s);
                }

                picker.value = currentColor.startsWith('hsl') ? '#1976D2' : currentColor;
                picker.style.cssText = 'border:none; padding:0; background:none; width:30px; height:30px; cursor:pointer; border-radius:5px;';
                picker.oninput = (e) => saveSubjectColor(s, e.target.value);
                
                row.appendChild(label);
                row.appendChild(picker);
                return row;
            };

            // Breaks section
            const breaksGroup = document.createElement('div');
            breaksGroup.className = 'ios-group';
            breaksGroup.appendChild(createColorRow('Ob\u011Bd'));
            breaksGroup.appendChild(createColorRow('Pauza'));
            breaksUi.appendChild(breaksGroup);

            // Banner section
            const bannerHeader = document.createElement('div');
            bannerHeader.className = 'ios-header';
            bannerHeader.textContent = 'Banner';
            breaksUi.appendChild(bannerHeader);

            const bannerGroup = document.createElement('div');
            bannerGroup.className = 'ios-group';
            
            // Now Banner Row
            const nowRow = document.createElement('div');
            nowRow.className = 'ios-row';
            const nowLabel = document.createElement('span');
            nowLabel.textContent = 'Prob\xEDhaj\xEDc\xED hodina';
            nowLabel.style.fontWeight = '500';
            const nowPicker = document.createElement('input');
            nowPicker.type = 'color';
            nowPicker.value = nowBannerColor;
            nowPicker.style.cssText = 'border:none; padding:0; background:none; width:30px; height:30px; cursor:pointer; border-radius:5px;';
            nowPicker.oninput = (e) => saveBannerColor(e.target.value);
            nowRow.appendChild(nowLabel);
            nowRow.appendChild(nowPicker);
            bannerGroup.appendChild(nowRow);

            // Next Banner Row
            const nextRow = document.createElement('div');
            nextRow.className = 'ios-row';
            const nextLabel = document.createElement('span');
            nextLabel.textContent = 'P\u0159\xED\u0161t\xED hodina';
            nextLabel.style.fontWeight = '500';
            const nextPicker = document.createElement('input');
            nextPicker.type = 'color';
            nextPicker.value = nowBannerBreakColor;
            nextPicker.style.cssText = 'border:none; padding:0; background:none; width:30px; height:30px; cursor:pointer; border-radius:5px;';
            nextPicker.oninput = (e) => saveBannerBreakColor(e.target.value);
            nextRow.appendChild(nextLabel);
            nextRow.appendChild(nextPicker);
            bannerGroup.appendChild(nextRow);
            
            breaksUi.appendChild(bannerGroup);

            // Subjects section
            const subjectsGroup = document.createElement('div');
            subjectsGroup.className = 'ios-group';
            
            let hasSubjects = false;
            subjects.forEach(s => {
                if (s === 'Ob\u011Bd' || s === 'Pauza') return;
                subjectsGroup.appendChild(createColorRow(s));
                hasSubjects = true;
            });
            
            if (hasSubjects) {
                ui.appendChild(subjectsGroup);
            } else {
                ui.innerHTML = '<div style="padding:10px; color:var(--text-dim); font-size:0.9rem;">\u017D\xE1dn\xE9 vybran\xE9 p\u0159edm\u011Bty k zobrazen\xED.</div>';
            }
        }
        
        function savePrimaryColor(color) {
            primaryColor = color;
            localStorage.setItem('primaryColor', color);
            applyTheme();
            render();
            processNow();
        }

        function saveBannerColor(color) {
            nowBannerColor = color;
            localStorage.setItem('nowBannerColor', color);
            applyTheme();
            render();
            processNow();
        }

        function saveBannerBreakColor(color) {
            nowBannerBreakColor = color;
            localStorage.setItem('nowBannerBreakColor', color);
            applyTheme();
            render();
            processNow();
        }
        
        function saveSubjectColor(subject, color) {
            subjectColors[subject] = color;
            localStorage.setItem('subjectColors', JSON.stringify(subjectColors));
            render();
            processNow();
        }

        function openAbsenceSubmenu() {
            document.getElementById('absence-submenu-overlay').style.display = 'block';
            const modal = document.getElementById('absence-submenu-modal');
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('active'), 10);
            updateAbsenceConfigUI();
        }

        function closeAbsenceSubmenu() {
            const modal = document.getElementById('absence-submenu-modal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('absence-submenu-overlay').style.display = 'none';
            }, 300);
        }
        
        function updateAbsenceConfigUI() {
            const ui = document.getElementById('absence-config-ui');
            if (!ui || !fullData) return;
            ui.innerHTML = '';
            
            const subjectsSet = new Set();
            const idLower = selectedId.toLowerCase();
            const entityData = fullData[idLower];
            if (entityData) {
                ['actual', 'next'].forEach(wk => {
                    if (entityData[wk] && entityData[wk].items) {
                        entityData[wk].items.forEach(i => {
                            if (i.subject && !i.isPause && !i.subject.includes('Ob\u011Bd') && shouldShowLesson(i)) {
                                subjectsSet.add(i.subject);
                            }
                        });
                    }
                });
            }
            
            const subjects = Array.from(subjectsSet).sort((a, b) => a.localeCompare(b, 'cs'));
            if (subjects.length === 0) {
                ui.innerHTML = '<div style="padding:10px; color:var(--text-dim); font-size:0.9rem;">\u017D\xE1dn\xE9 vybran\xE9 p\u0159edm\u011Bty k zobrazen\xED.</div>';
                return;
            }

            const group = document.createElement('div');
            group.className = 'ios-group';
            
            subjects.forEach(s => {
                const row = document.createElement('div');
                row.className = 'ios-row';
                row.style.flexDirection = 'column';
                row.style.alignItems = 'stretch';
                row.style.gap = '10px';
                
                const topRow = document.createElement('div');
                topRow.style.display = 'flex';
                topRow.style.justifyContent = 'space-between';
                
                const label = document.createElement('span');
                label.textContent = s;
                label.style.fontWeight = '800';
                
                const stats = absenceData[s] || { absences: 0, total: 0 };
                const percent = stats.total > 0 ? Math.round((stats.absences / stats.total) * 100) : 0;
                const percentSpan = document.createElement('span');
                percentSpan.textContent = percent + '%';
                
                if (percent >= 20) percentSpan.style.color = '#ff0000';
                else if (percent >= 10) percentSpan.style.color = '#ff9800';
                else if (percent > 0) percentSpan.style.color = '#4caf50';
                else percentSpan.style.color = 'var(--text-dim)';
                
                percentSpan.style.fontWeight = 'bold';
                
                topRow.appendChild(label);
                topRow.appendChild(percentSpan);
                
                const inputRow = document.createElement('div');
                inputRow.style.display = 'flex';
                inputRow.style.alignItems = 'center';
                inputRow.style.gap = '10px';
                
                const absInput = document.createElement('input');
                absInput.type = 'number';
                absInput.value = stats.absences;
                absInput.placeholder = 'Abs';
                absInput.style.cssText = 'width: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--tab-bg); color: var(--text); text-align: center;';
                absInput.oninput = () => saveAbsenceBaseData(s, absInput.value, totalInput.value, false);
                
                const slash = document.createElement('span');
                slash.textContent = '/';
                
                const totalInput = document.createElement('input');
                totalInput.type = 'number';
                totalInput.value = stats.total;
                totalInput.placeholder = 'Total';
                totalInput.style.cssText = 'width: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--tab-bg); color: var(--text); text-align: center;';
                totalInput.oninput = () => saveAbsenceBaseData(s, absInput.value, totalInput.value, false);
                
                const saveBtn = document.createElement('button');
                saveBtn.textContent = 'OK';
                saveBtn.style.cssText = 'flex: 1; padding: 8px; border-radius: 6px; background: var(--primary); color: white; border: none; font-weight: bold; cursor: pointer;';
                saveBtn.onclick = () => {
                    saveAbsenceBaseData(s, absInput.value, totalInput.value, true);
                    saveBtn.textContent = 'ULO\u017DENO!';
                    saveBtn.style.background = '#4caf50';
                    saveBtn.style.color = 'black';
                    setTimeout(() => {
                        saveBtn.textContent = 'OK';
                        saveBtn.style.background = 'var(--primary)';
                    }, 1500);
                };

                inputRow.appendChild(absInput);
                inputRow.appendChild(slash);
                inputRow.appendChild(totalInput);
                inputRow.appendChild(saveBtn);
                
                row.appendChild(topRow);
                row.appendChild(inputRow);
                group.appendChild(row);
            });
            
            ui.appendChild(group);
        }

        function saveAbsenceBaseData(subject, abs, total, refreshUI) {
            // Re-read from storage to ensure we have latest
            absenceData = JSON.parse(localStorage.getItem('absenceData') || '{}');
            
            absenceData[subject] = {
                absences: parseInt(abs) || 0,
                total: parseInt(total) || 0
            };
            localStorage.setItem('absenceData', JSON.stringify(absenceData));
            
            if (refreshUI) {
                updateAbsenceConfigUI();
            } else {
                // Just update the percentage display in the row without full refresh to avoid losing focus
                const subjects = Array.from(document.querySelectorAll('#absence-config-ui .ios-row'));
                const row = subjects.find(r => r.querySelector('span').textContent === subject);
                if (row) {
                    const percentSpan = row.querySelector('div > span:last-child');
                    const stats = absenceData[subject];
                    const percent = stats.total > 0 ? Math.round((stats.absences / stats.total) * 100) : 0;
                    percentSpan.textContent = percent + '%';
                    percentSpan.style.color = percent >= 20 ? '#ff0000' : 'var(--text-dim)';
                }
            }
            
            render();
            processNow();
        }

        function renderAttendancePanel(subject) {
            const container = document.getElementById('attendance-detail-container');
            if (!container) return;

            const stats = absenceData[subject] || { absences: 0, total: 0 };
            const percent = stats.total > 0 ? Math.round((stats.absences / stats.total) * 100) : 0;

            let attendanceClass = "";
            if (percent >= 20) attendanceClass = "high";
            else if (percent >= 10) attendanceClass = "medium";
            else if (percent > 0) attendanceClass = "low";

            container.innerHTML = \`

                <div class="attendance-panel">
                    <div class="attendance-stats">
                        <div>
                            <div class="detail-label">Hl\xEDd\xE1n\xED absence \u{1F436}</div>
                            <div style="font-weight: 600; font-size: 0.9rem;">\${stats.absences} / \${stats.total} hodin</div>
                        </div>
                        <div class="attendance-percent \${attendanceClass}">\${percent}%</div>
                    </div>
                    <div class="attendance-controls">
                        <button class="attendance-btn present" onclick="updateAttendance('\${subject}', false)">BYL JSEM</button>
                        <button class="attendance-btn absent" onclick="updateAttendance('\${subject}', true)">CHYB\u011AL JSEM</button>
                    </div>
                </div>
            \`;
        }

        function updateAttendance(subject, missed) {
            if (!absenceData[subject]) absenceData[subject] = { absences: 0, total: 0 };
            
            absenceData[subject].total += 1;
            if (missed) {
                absenceData[subject].absences += 1;
            }
            
            localStorage.setItem('absenceData', JSON.stringify(absenceData));
            renderAttendancePanel(subject);
            render();
            processNow();
        }

        function adjustAttendance(subject, absDiff, totalDiff) {
            if (!absenceData[subject]) absenceData[subject] = { absences: 0, total: 0 };
            
            absenceData[subject].absences = Math.max(0, absenceData[subject].absences + absDiff);
            absenceData[subject].total = Math.max(absenceData[subject].absences, absenceData[subject].total + totalDiff);
            
            localStorage.setItem('absenceData', JSON.stringify(absenceData));
            renderAttendancePanel(subject);
            render();
            processNow();
        }
        
        function showDetail(l, hour) {
            const body = document.getElementById('detail-body');
            
            let html = '';
            const isPause = l.subject === 'Pauza';
            const isLunch = l.subject.includes('Ob\u011Bd');

            if (isPause) {
                html += \`
                    <div class="detail-header" style="color: \${getSubjectColor(l.subject)}">\${l.subject}</div>
                    <div class="detail-item">
                        <div class="detail-label">\u010Cas</div>
                        <div>\${hour}. hodina (\${l.time})</div>
                    </div>
                \`;
            } else if (isLunch) {
                html += \`
                    <div class="detail-header" style="color: \${getSubjectColor(l.subject)}">\${l.subject}</div>
                    <div class="detail-item">
                        <div class="detail-label">\u010Cas</div>
                        <div>\${hour}. hodina (\${l.time})</div>
                    </div>
                    \${l.theme ? \`
                    <div class="detail-item">
                        <div class="detail-label">Menu</div>
                        <div style="font-style: italic;">\${safeMenuHTML(l.theme)}</div>
                    </div>
                    \` : ''}
                \`;
            } else {
                html += \`
                    <div class="detail-label">P\u0159edm\u011Bt</div>
                    <div class="detail-header" style="color: \${getSubjectColor(l.subject)}">\${l.subject}</div>
                    
                    <div class="detail-item">
                        <div class="detail-label">\u010Cas</div>
                        <div>\${hour}. hodina (\${l.time})</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">Vyu\u010Duj\xEDc\xED</div>
                        <div>\${(l.teacher && l.teacher !== '-') ? l.teacher : (selectedType === 'teacher' ? getEntityName(selectedId) : 'Nezn\xE1mo')}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">M\xEDstnost</div>
                        <div class="room-badge" style="display:inline-block; font-size:1.2rem; padding:5px 15px;">\${l.room}</div>
                    </div>

                    \${l.theme ? \`
                    <div class="detail-item">
                        <div class="detail-label">T\xE9ma</div>
                        <div style="font-style: italic;">\${safeMenuHTML(l.theme)}</div>
                    </div>
                    \` : ''}

                    \${l.group ? \`
                    <div class="detail-item">
                        <div class="detail-label">Skupina</div>
                        <div>\${l.group}</div>
                    </div>
                    \` : ''}

                    <div id="attendance-detail-container"></div>
                \`;
            }
            
            body.innerHTML = html;
            
            // Add Hl\xEDd\xE1n\xED absence \u{1F436} panel if it's a real lesson
            if (!isPause && !isLunch) {
                renderAttendancePanel(l.subject);
            }

            document.getElementById('detail-overlay').style.display = 'block';
            const modal = document.getElementById('detail-modal');
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('active'), 10);
        }
        
        function closeDetail() {
            const modal = document.getElementById('detail-modal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('detail-overlay').style.display = 'none';
            }, 300);
        }

        function openNoteModal() {
            // Now opens the notes submenu instead of a separate modal
            openNotesSubmenu();
            
            // Scroll to top to ensure form is visible
            const modal = document.getElementById('notes-submenu-modal');
            if (modal) modal.scrollTop = 0;
            
            // Set default date if form is empty
            const dateInput = document.getElementById('note-date');
            if (dateInput && !dateInput.value) {
                dateInput.value = getNow().toISOString().split('T')[0];
            }
        }

        function closeNoteModal() {
            // If we are in the notes submenu, just reset the form
            resetNoteForm();
        }
        
        window.resetNoteForm = function() {
            window.editingNoteId = null;
            document.getElementById('note-subject').value = '';
            document.getElementById('note-text').value = '';
            document.getElementById('note-is-test').checked = false;
            document.getElementById('note-date').value = getNow().toISOString().split('T')[0];
            
            document.getElementById('save-note-btn').textContent = 'P\u0158IDAT';
            document.getElementById('cancel-edit-btn').style.display = 'none';
            document.getElementById('notes-submenu-title').textContent = 'Pozn\xE1mky';
        };

        function saveNote() {
            const date = document.getElementById('note-date').value;
            const subject = document.getElementById('note-subject').value.trim();
            const text = document.getElementById('note-text').value.trim();
            const isTest = document.getElementById('note-is-test').checked;

            if (!date || !subject) {
                alert('Pros\xEDm vypl\u0148te alespo\u0148 datum a p\u0159edm\u011Bt.');
                return;
            }

            if (window.editingNoteId) {
                const idx = notes.findIndex(n => n.id === window.editingNoteId);
                if (idx !== -1) {
                    notes[idx].date = date;
                    notes[idx].subject = subject;
                    notes[idx].text = text;
                    notes[idx].isTest = isTest;
                }
            } else {
                const newNote = {
                    id: Date.now(),
                    date,
                    subject,
                    text,
                    isTest
                };
                notes.push(newNote);
            }

            localStorage.setItem('timetableNotes', JSON.stringify(notes));
            resetNoteForm();
            render();
            processNow();
            renderNotesList();
        }
        
        function deleteNote(id) {
            notes = notes.filter(n => n.id !== id);
            localStorage.setItem('timetableNotes', JSON.stringify(notes));
            render();
            processNow();
        }

        function cleanupNotes() {
            const today = getNow();
            today.setHours(0, 0, 0, 0);

            const initialCount = notes.length;
            notes = notes.filter(n => {
                const noteDate = new Date(n.date);
                noteDate.setHours(0, 0, 0, 0);
                return noteDate >= today;
            });

            if (notes.length !== initialCount) {
                localStorage.setItem('timetableNotes', JSON.stringify(notes));
                console.log('Cleaned up ' + (initialCount - notes.length) + ' past notes.');
            }
        }
        
        function updateSensitivityDisplay(val) {
            document.getElementById('sensitivity-value').textContent = val + 'px';
        }

        function saveSensitivity(val) {
            swipeSensitivity = parseInt(val);
            localStorage.setItem('swipeSensitivity', val);
        }

        function initSensitivityUI() {
            const slider = document.getElementById('swipe-sensitivity');
            if (slider) {
                slider.value = swipeSensitivity;
                updateSensitivityDisplay(swipeSensitivity);
            }
        }
        
        function refreshAppData() {
            localStorage.removeItem('timetableCache');
            if ('caches' in window) {
                caches.keys().then(names => {
                    for (let name of names) caches.delete(name);
                });
            }
            window.location.reload(true);
        }

        function clearAppCache() {
            if (confirm('Opravdu chcete vymazat v\u0161echna data a resetovat aplikaci?')) {
                localStorage.clear();
                // If there's a service worker, we should also try to clear its caches
                if ('caches' in window) {
                    caches.keys().then(names => {
                        for (let name of names) caches.delete(name);
                    });
                }
                window.location.reload(true);
            }
        }


        async function toggleNotifications() {
            if (!notificationsEnabled) {
                if (!('Notification' in window)) {
                    alert('Tento prohl\xED\u017Ee\u010D nepodporuje ozn\xE1men\xED.');
                    return;
                }
                
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        // Register for Web Push if Service Worker is available
                        if ('serviceWorker' in navigator) {
                            const registration = await navigator.serviceWorker.ready;
                            
                            // Check for existing subscription
                            let subscription = await registration.pushManager.getSubscription();
                            
                            if (!subscription) {
                                // Request new subscription
                                // NOTE: Replace 'YOUR_PUBLIC_VAPID_KEY' with a real key
                                try {
                                    subscription = await registration.pushManager.subscribe({
                                        userVisibleOnly: true,
                                        applicationServerKey: 'BLuWvS7G6k5C_u_YhX6A9N6j_f9k_f6f_f6f_f6f_f6f_f6f_f6f_f6f_f6f_f' // Placeholder
                                    });
                                } catch (err) {
                                    console.warn('Push subscribe failed:', err);
                                    // Fallback to local polling if push fails
                                }
                            }

                            if (subscription) {
                                await fetch('/api/subscribe', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ subscription, class: selectedClass })
                                });
                            }
                        }

                        notificationsEnabled = true;
                        localStorage.setItem('notificationsEnabled', 'true');
                        updateNotifBtn();
                        processNow();
                    } else if (permission === 'denied') {
                        alert('Povolen\xED bylo zam\xEDtnuto.');
                    }
                } catch (e) {
                    console.error('Notification setup failed:', e);
                }
            } else {
                notificationsEnabled = false;
                localStorage.setItem('notificationsEnabled', 'false');
                updateNotifBtn();
                // Optionally unsubscribe from server here
            }
        }
    
        function updateNotifBtn() {
            const btn = document.getElementById('notif-btn');
            if (!btn) return;
            btn.style.background = notificationsEnabled ? 'var(--primary)' : 'var(--tab-bg)';
            btn.style.color = notificationsEnabled ? 'white' : 'var(--text)';
            btn.style.border = notificationsEnabled ? '1px solid var(--primary)' : '1px solid var(--border)';
            btn.textContent = (notificationsEnabled ? '\u{1F514}' : '\u{1F515}') + ' Ozn\xE1men\xED';
        }
    
        let isChangingEntity = false;

        function setEntity(type, id) {
            if (isChangingEntity) return;
            
            selectedType = type;
            selectedId = id;
            selectedClass = id; 
            isChangingEntity = true;
            
            localStorage.setItem('selectedType', type);
            localStorage.setItem('selectedId', id);
            
            // Update UI to show selected state immediately
            updateFilterUI();
            
            const fetchUrl = '/api/timetable?type=' + type + '&id=' + id + '&t=' + Date.now();
            
            fetch(fetchUrl)
            .then(r => r.json())
            .then((d) => {
                localStorage.setItem('timetableCache', JSON.stringify(d));
                fullData = d;
                isChangingEntity = false;
                
                prevDay = null; 
                selectedDay = null; 
                initDaySelector(); 
                updateFilterUI(); 
                updateColorPaletteUI(); 
                render(); 
                processNow();
            })
            .catch(err => {
                isChangingEntity = false;
                console.error('Fetch failed for entity', err);
                updateFilterUI();
            });
        }

        function setWeek(w) {
            if (selectedWeek === w) return;
            prevWeek = selectedWeek;
            selectedWeek = w;
            const bActual = document.getElementById('btn-actual');
            const bNext = document.getElementById('btn-next');
            if (bActual) bActual.classList.toggle('active', w === 'actual');
            if (bNext) bNext.classList.toggle('active', w === 'next');
            prevDay = null; // Important: reset day when switching weeks
            selectedDay = null; 
            initDaySelector(); 
            updateFilterUI(); 
            render(); 
            processNow();
        }

        function setDay(d) {
            console.log('setDay called with:', d, 'current selectedDay:', selectedDay);
            if (selectedDay === d) return;
            prevDay = selectedDay;
            selectedDay = d;
            initDaySelector();
            render();
            processNow();
        }        
        function initDaySelector() {
            if (!fullData) return;
            const container = document.getElementById('day-selector');
            if (!container) return;
            
            const entityData = fullData[selectedId.toLowerCase()];
            if (!entityData || !entityData[selectedWeek]) return;

            const items = entityData[selectedWeek].items;
            
            // Map of found dates (po -> 17.3.)
            const dayToDate = {};
            items.forEach(i => {
                const parts = i.date.split(' ');
                if (parts[0] && parts[1]) dayToDate[parts[0]] = parts[1];
            });

            // If we are missing some days (e.g. teacher teaches only Wed), 
            // find one existing date and calculate the others.
            const existingDaysFound = Object.keys(dayToDate);
            if (existingDaysFound.length > 0) {
                const existingDay = existingDaysFound[0];
                const existingIdx = daysOrder.indexOf(existingDay);
                const dateParts = dayToDate[existingDay].split('.').filter(p => p).map(Number);
                const d = dateParts[0];
                const m = dateParts[1];
                
                const baseDate = getNow();
                baseDate.setMonth(m - 1);
                baseDate.setDate(d);
                
                daysOrder.forEach((day, idx) => {
                    if (!dayToDate[day]) {
                        const newDate = new Date(baseDate);
                        newDate.setDate(baseDate.getDate() + (idx - existingIdx));
                        dayToDate[day] = newDate.getDate() + '.' + (newDate.getMonth() + 1) + '.';
                    }
                });
            }

            if (!selectedDay) {
                if (selectedWeek === 'actual') {
                    const todayShort = daysOrder[getNow().getDay()-1];
                    selectedDay = daysOrder.includes(todayShort) ? todayShort : daysOrder[0];
                } else { selectedDay = daysOrder[0]; }
            }

            container.innerHTML = '';
            daysOrder.forEach(d => {
                const btn = document.createElement('button');
                btn.className = 'day-btn ' + (d === selectedDay ? 'active' : '');
                btn.style.flexDirection = 'column';
                btn.style.lineHeight = '1.1';
                
                const dateOnly = dayToDate[d] || '';

                btn.innerHTML = \`
                    <span style="font-size: 0.9rem;">\${d.toUpperCase()}</span>
                    <span style="font-size: 0.6rem; opacity: 0.8;">\${dateOnly}</span>
                \`;
                btn.onclick = function() { setDay(d); };
                container.appendChild(btn);
            });
            
            // Expose the mapping for render() to use
            window.currentDayToDate = dayToDate;
        }

        function getEntityName(id) {
            if (!fullData || !fullData.discovery) return id;
            const item = [...fullData.discovery.classes, ...fullData.discovery.teachers].find(i => i.id.toUpperCase() === id.toUpperCase());
            return item ? item.name : id;
        }

        function updateFilterUI() {
            try {
                const ui = document.getElementById('filter-ui');
                if (!ui) return;
                
                // If we are currently changing the entity, show a loading overlay or state
                if (isChangingEntity) {
                    // We don't want to wipe the whole UI if it already has content
                    // just dim it or show a spinner at the top
                    let loader = document.getElementById('filter-loader');
                    if (!loader) {
                        loader = document.createElement('div');
                        loader.id = 'filter-loader';
                        loader.style.cssText = 'padding: 20px; text-align: center; color: var(--primary); font-weight: bold;';
                        loader.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div><div style="margin-top:10px;">Načítám...</div>';
                        ui.prepend(loader);
                    }
                    // Dim the rest of the UI
                    const content = ui.querySelectorAll('div:not(#filter-loader)');
                    content.forEach(el => el.style.opacity = '0.5');
                    return;
                }

                ui.innerHTML = '';
                
                // Entity Type Toggle (Class vs Teacher)
                const typeHeader = document.createElement('div');
                typeHeader.className = 'ios-header';
                typeHeader.textContent = 'Typ rozvrhu';
                ui.appendChild(typeHeader);

                const typeRow = document.createElement('div');
                typeRow.className = 'settings-row';
                typeRow.style.margin = '0 16px 20px 16px';
                
                const btnClasses = document.createElement('button');
                btnClasses.className = 'tab-btn' + (selectedType === 'class' ? ' active' : '');
                btnClasses.textContent = 'Tř\xEDdy';
                btnClasses.style.border = '1px solid var(--border)';
                btnClasses.onclick = () => { selectedType = 'class'; updateFilterUI(); };
                
                const btnTeachers = document.createElement('button');
                btnTeachers.className = 'tab-btn' + (selectedType === 'teacher' ? ' active' : '');
                btnTeachers.textContent = 'U\u010Ditel\xE9';
                btnTeachers.style.border = '1px solid var(--border)';
                btnTeachers.onclick = () => { selectedType = 'teacher'; updateFilterUI(); };
                
                typeRow.appendChild(btnClasses);
                typeRow.appendChild(btnTeachers);
                ui.appendChild(typeRow);

                // Discovery Selector (Dropdown or Grid)
                if (fullData && fullData.discovery) {
                    const list = selectedType === 'class' ? fullData.discovery.classes : fullData.discovery.teachers;
                    
                    if (list && list.length > 0) {
                        const selectorHeader = document.createElement('div');
                        selectorHeader.className = 'ios-header';
                        selectorHeader.textContent = selectedType === 'class' ? 'Vyberte t\u0159\xEDdu' : 'Vyberte vyu\u010Duj\xEDc\xEDho';
                        ui.appendChild(selectorHeader);

                        const grid = document.createElement('div');
                        grid.style.display = 'grid';
                        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
                        grid.style.gap = '8px';
                        grid.style.padding = '0 16px 20px 16px';

                        list.forEach(item => {
                            const btn = document.createElement('button');
                            btn.className = 'tab-btn' + (selectedId.toUpperCase() === item.id.toUpperCase() ? ' active' : '');
                            btn.textContent = item.name; // Use descriptive name
                            btn.style.fontSize = '0.75rem';
                            btn.style.padding = '8px 4px';
                            btn.style.minHeight = '44px';
                            btn.style.border = '1px solid var(--border)';
                            btn.onclick = () => setEntity(selectedType, item.id);
                            grid.appendChild(btn);
                        });
                        ui.appendChild(grid);
                    }
                }

                if (fullData) {
                    const groupsSet = new Set();
                    // Extract groups for selected entity
                    const idLower = selectedId.toLowerCase();
                    const entityData = fullData[idLower];
                    if (entityData) {
                        ['actual', 'next'].forEach(wk => {
                            if (entityData[wk] && entityData[wk].items) {
                                entityData[wk].items.forEach(i => {
                                    // Normalize empty group to "-" for mandatory subjects
                                    const g = (i.group || "-").trim();
                                    groupsSet.add(g);
                                });
                            }
                        });
                    }
                    
                    const groups = Array.from(groupsSet);
                    if (groups.length > 0) {
                        const subjectList = [];
                        
                        groups.forEach(g => {
                            let displayName = g;

                            if (fullData && fullData[idLower]) {
                                let foundItem = null;
                                ['actual', 'next'].forEach(wk => {
                                    if (!foundItem && fullData[idLower][wk]) {
                                        foundItem = fullData[idLower][wk].items.find(i => (i.group || "-").trim() === g);
                                    }
                                });

                                if (g === '-') {
                                    displayName = 'Povinné předměty';
                                } else if (foundItem) {
                                    displayName = foundItem.subject;
                                    if (foundItem.teacher && foundItem.teacher !== '-') {
                                        displayName += ' - ' + foundItem.teacher;
                                    }
                                }
                            }
                            subjectList.push({ id: g, name: displayName });
                        });

                        // Sort alphabetically
                        subjectList.sort((a, b) => a.name.localeCompare(b.name, 'cs'));

                        const listHeader = document.createElement('div');
                        listHeader.className = 'ios-header';
                        listHeader.textContent = 'Předměty a skupiny';
                        ui.appendChild(listHeader);

                        const groupContainer = document.createElement('div');
                        groupContainer.className = 'ios-group';
                        
                        subjectList.forEach(item => {
                            const g = item.id;
                            const isHidden = hiddenGroups.includes(g);
                            const displayName = item.name;

                            const row = document.createElement('div');
                            row.className = 'ios-row';
                            row.style.cursor = 'pointer';
                            row.onclick = function(e) {
                                if (e.target.tagName.toLowerCase() !== 'input') {
                                    const inputEl = row.querySelector('input');
                                    if (inputEl) inputEl.checked = !inputEl.checked;
                                    toggleFilterGroup(g, true);
                                }
                            };
                            
                            const labelSpan = document.createElement('span');
                            labelSpan.textContent = displayName;
                            labelSpan.style.fontWeight = '500';
                            
                            const switchLabel = document.createElement('label');
                            switchLabel.className = 'ios-switch';
                            switchLabel.onclick = function(e) { e.stopPropagation(); };
                            
                            const input = document.createElement('input');
                            input.type = 'checkbox';
                            input.checked = !isHidden;
                            input.onchange = function() { toggleFilterGroup(g, true); };
                            
                            const slider = document.createElement('span');
                            slider.className = 'ios-slider';
                            
                            switchLabel.appendChild(input);
                            switchLabel.appendChild(slider);
                            
                            row.appendChild(labelSpan);
                            row.appendChild(switchLabel);
                            groupContainer.appendChild(row);
                        });
                        
                        ui.appendChild(groupContainer);
                    }
                }
            } catch (e) { console.error("Filter UI error:", e); }
        }

    
        function toggleFilterGroup(g, skipUIUpdate = false) {
            if (hiddenGroups.includes(g)) {
                hiddenGroups = hiddenGroups.filter(item => item !== g);
            } else {
                hiddenGroups.push(g);
            }
            localStorage.setItem('hiddenGroups', JSON.stringify(hiddenGroups));
            if (!skipUIUpdate) updateFilterUI();
            render();
            processNow();
        }
        
        function getPngIcon() {
            if (cachedIcon) return cachedIcon;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 192;
                canvas.height = 192;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#1976D2';
                ctx.beginPath();
                ctx.roundRect(0, 0, 192, 192, 40);
                ctx.fill();
                ctx.font = '140px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('\u{1F4C5}', 96, 105);
                cachedIcon = canvas.toDataURL('image/png');
                return cachedIcon;
            } catch (e) {
                return null;
            }
        }
        
        function toggleDebug() {
            const el = document.getElementById('debug-bar');
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
        

        function getSubjectColor(subject) {
            // Normalize subject for special cases
            let s = subject;
            if (s.includes('Ob\u011Bd')) s = 'Ob\u011Bd';
            
            // Check for user-defined custom color first
            if (subjectColors && subjectColors[s]) {
                return subjectColors[s];
            }
            
            // Default colors for Lunch and Pause
            if (s === 'Ob\u011Bd' || s === 'Pauza') {
                return '#4caf50';
            }
            
            let hash = 0;
            for (let i = 0; i < s.length; i++) {
                hash = s.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = Math.abs(hash) % 360;
            const lightness = darkMode ? 65 : 40;
            return 'hsl(' + hue + ', 70%, ' + lightness + '%)';
        }

        window.renderNotesList = function() {
            const listEl = document.getElementById('notes-list-ui');
            if (!listEl) return;
            
            if (notes.length === 0) {
                listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-dim);">Žádné uložené poznámky.</div>';
                return;
            }

            const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));

            let html = '<div class="ios-group">';
            sortedNotes.forEach(n => {
                const dateParts = n.date.split('-');
                const formattedDate = dateParts[2] + '.' + dateParts[1] + '.';
                html += \`
                    <div class="ios-row" style="flex-direction: column; align-items: stretch; padding: 12px 16px; cursor: default; border-bottom: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                            <div style="font-weight: 700; color: \${n.isTest ? '#f44336' : 'var(--primary)'};">\${n.subject.toUpperCase()}\${n.isTest ? ' (TEST)' : ''}</div>
                            <div style="font-size: 0.8rem; color: var(--text-dim); font-weight: 600;">\${formattedDate}</div>
                        </div>
                        \${n.text ? \`<div style="font-size: 0.9rem; margin-bottom: 8px; line-height: 1.4;">\${n.text}</div>\` : ''}
                        <div style="display: flex; gap: 10px; margin-top: 4px;">
                            <button onclick="editNote(\${n.id})" style="background: rgba(25, 118, 210, 0.1); color: var(--primary); border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">UPRAVIT</button>
                            <button onclick="deleteNote(\${n.id}); renderNotesList();" style="background: rgba(244, 67, 54, 0.1); color: #f44336; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">SMAZAT</button>
                        </div>
                    </div>
                \`;
            });
            html += '</div>';
            listEl.innerHTML = html;
        };

        window.openNotesSubmenu = function() {
            renderNotesList();
            document.getElementById('notes-submenu-overlay').style.display = 'block';
            const modal = document.getElementById('notes-submenu-modal');
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('active'), 10);
        };

        window.closeNotesSubmenu = function() {
            const modal = document.getElementById('notes-submenu-modal');
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.getElementById('notes-submenu-overlay').style.display = 'none';
            }, 300);
        };

        window.editNote = function(id) {
            const note = notes.find(n => n.id === id);
            if (!note) return;
            
            window.editingNoteId = id;
            
            document.getElementById('note-date').value = note.date;
            document.getElementById('note-subject').value = note.subject;
            document.getElementById('note-text').value = note.text || '';
            document.getElementById('note-is-test').checked = !!note.isTest;
            
            // UI changes for editing mode
            document.getElementById('save-note-btn').textContent = 'ULO\u017DIT ZM\u011ANY';
            document.getElementById('cancel-edit-btn').style.display = 'block';
            document.getElementById('notes-submenu-title').textContent = 'Upravit pozn\xE1mku';
            
            // Scroll to form at top
            const modal = document.getElementById('notes-submenu-modal');
            if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
        };
`;