export const CLIENT_RENDER = `
            function updateProcessedLessons() {
                if (!fullData || selectedWeek !== 'actual') return;
                const now = getNow();
                const todayShort = daysOrder[now.getDay()-1];
                if (!todayShort) return;

                const key = \`\${selectedId}-\${selectedWeek}-\${todayShort}-\${hiddenGroups.join(',')}\`;
                if (key === lastProcessedKey) return;

                const entityData = fullData[selectedId.toLowerCase()];
                if (!entityData || !entityData.actual) return;

                const items = entityData.actual.items;
                let filtered = items.filter(l => l.date.startsWith(todayShort) && shouldShowLesson(l));
                
                const calculatedDate = (window.currentDayToDate && window.currentDayToDate[todayShort]) ? window.currentDayToDate[todayShort] : '';
                const dateStr = (filtered.length > 0) ? filtered[0].date.split(' ')[1] : calculatedDate;
                
                const normalizeDate = (s) => s.split('.').filter(p => p).map(p => parseInt(p).toString()).join('.') + '.';
                const targetKey = dateStr ? normalizeDate(dateStr) : '';
                const menuText = (fullData.menu && targetKey) ? fullData.menu[targetKey] : '';
                const isTeacher = (typeof selectedType !== 'undefined' && selectedType === 'teacher');

                if (filtered.length === 0 && !menuText) {
                    cachedDayLessons = [];
                    lastProcessedKey = key;
                    return;
                }

                const bh = {};
                filtered.forEach(i => { if (!bh[i.hour]) bh[i.hour] = []; bh[i.hour].push(i); });
                const hn = Object.keys(bh).map(Number).sort((a,b) => a-b);
                let lunchAssigned = false;

                const augmented = [...filtered];
                const minH = hn.length > 0 ? hn[0] : 5;
                const maxH = hn.length > 0 ? hn[hn.length-1] : 5;

                for (let h = minH; h <= maxH; h++) {
                    if (!bh[h]) {
                        const isLunch = !lunchAssigned && h >= 5 && h <= 7;
                        if (isLunch) lunchAssigned = true;
                        augmented.push({
                            subject: (isLunch && menuText) ? 'Oběd <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-left: 4px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>' : 'Pauza',
                            time: HOUR_TIMES[h] || '',
                            room: '-',
                            teacher: '-',
                            hour: h,
                            theme: (isLunch && menuText) ? menuText : '',
                            date: todayShort + ' ' + dateStr,
                            isPause: true
                        });
                    }
                }

                if (!lunchAssigned && menuText && (isTeacher || maxH < 7)) {
                    const possibleLunchHours = [5, 6, 7].filter(h => h > maxH || !bh[h]);
                    if (possibleLunchHours.length > 0) {
                        const lunchHour = possibleLunchHours[0];
                        augmented.push({
                            subject: 'Oběd <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-left: 4px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>',
                            time: HOUR_TIMES[lunchHour] || '',
                            room: '-',
                            teacher: '-',
                            hour: lunchHour,
                            theme: menuText,
                            date: todayShort + ' ' + dateStr,
                            isPause: true
                        });
                        lunchAssigned = true;
                    }
                }
                augmented.sort((a, b) => a.hour - b.hour);
                cachedDayLessons = augmented;
                lastProcessedKey = key;
            }
            
            function render() {
                try {
                    console.log('Render called for:', selectedId, selectedWeek, selectedDay);
                    if (!fullData) return;
                    const app = document.getElementById('app');
                    if (!app) return;
                    
                    const entityData = fullData[selectedId.toLowerCase()];
                    if (!entityData || !entityData[selectedWeek]) {
                        app.innerHTML = '<div style="padding:40px; text-align:center;">Načítání dat pro ' + selectedId + '...</div>';
                        return;
                    }

                    let items = entityData[selectedWeek].items.filter(i => i.date.startsWith(selectedDay));

                    const headerDateEl = document.getElementById('header-date');
                    let calculatedDate = (window.currentDayToDate && window.currentDayToDate[selectedDay]) ? window.currentDayToDate[selectedDay] : '';

                    // Fallback date calculation if no lessons and not in dictionary
                    if (!calculatedDate) {
                        const now = getNow();
                        const currentDayIdx = now.getDay() - 1; // 0-6
                        const targetDayIdx = daysOrder.indexOf(selectedDay);
                        const diff = targetDayIdx - currentDayIdx;

                        const targetDate = new Date(now);
                        targetDate.setDate(now.getDate() + diff);

                        if (selectedWeek === 'next') {
                            targetDate.setDate(targetDate.getDate() + 7);
                        }

                        calculatedDate = targetDate.getDate() + '.' + (targetDate.getMonth() + 1) + '.';
                    }

                    if (headerDateEl) {
                        const dayFull = dayNamesFull[selectedDay] || selectedDay;
                        headerDateEl.textContent = dayFull + ' ' + calculatedDate;
                    }

                    const entityEl = document.getElementById('header-entity');
                    if (entityEl) {
                        entityEl.textContent = userName || getEntityName(selectedId);
                    }

                    items = items.filter(shouldShowLesson);
                    const isTeacher = (typeof selectedType !== 'undefined' && selectedType === 'teacher');
                    const dateStr = (items[0] && items[0].date) ? items[0].date.split(' ')[1] : calculatedDate;
                    const normalizeDate = (s) => s.split('.').filter(p => p).map(p => parseInt(p).toString()).join('.') + '.';
                    const targetKey = dateStr ? normalizeDate(dateStr) : '';
                    let menuText = (fullData.menu && targetKey) ? fullData.menu[targetKey] : '';                    
                    if (!menuText && dateStr) {
                        const [d, m] = dateStr.split('.').map(Number);
                        const now = getNow();
                        const currentDay = now.getDate();
                        const currentMonth = now.getMonth() + 1;
                        if (m < currentMonth || (m === currentMonth && d < currentDay)) {
                            menuText = 'Nelze získat stará data o menu.';
                        }
                    }

                    if (items.length === 0) { 
                        const pauseColor = getSubjectColor('Pauza');
                        let glowColor = pauseColor;
                        if (glowColor.startsWith('hsl')) {
                            glowColor = glowColor.replace('hsl', 'hsla').replace(')', ', 0.08)');
                        } else if (glowColor.startsWith('#')) {
                            glowColor = glowColor + '14';
                        }

                        let html = '<div class="grid-container fade-scale">';
                        html += '<div class="lesson-card" style="border-left: 5px solid ' + pauseColor + '; background: linear-gradient(135deg, var(--card) 85%, ' + glowColor + '); cursor: default;">';
                        html += '<div class="card-hour-box" style="background: ' + pauseColor + '; color: white;">\u2728</div>';
                        html += '<div class="card-main">';
                        html += '<div class="card-content" style="padding: 15px 0;">';
                        html += '<div style="font-size: 1.2rem; font-weight: 800; color: ' + pauseColor + ';">VOLNO</div>';
                        html += '<div style="font-size: 0.8rem; color: var(--text-dim);">Dnes nem\xE1te \u017E\xE1dnou v\xFDuku.</div>';
                        html += '</div></div></div>';

                        if (menuText) {
                            const lunchHour = 5;
                            const lunchObj = {
                                subject: 'Oběd <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-left: 4px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>',
                                time: HOUR_TIMES[lunchHour] || '',
                                room: '-',
                                teacher: '-',
                                theme: menuText,
                                date: selectedDay,
                                isPause: true
                            };
                            const lessonData = JSON.stringify(lunchObj).replace(/'/g, "&#39;");
                            const lunchColor = getSubjectColor('Oběd');
                            let lunchGlow = lunchColor;
                            if (lunchGlow.startsWith('hsl')) lunchGlow = lunchGlow.replace('hsl', 'hsla').replace(')', ', 0.08)');
                            else if (lunchGlow.startsWith('#')) lunchGlow = lunchGlow + '14';

                            html += '<div class="lesson-card" style="margin-top: 15px; animation-delay: 0.1s; background: linear-gradient(135deg, var(--card) 85%, ' + lunchGlow + ')" onclick=\\'showDetail(' + lessonData + ', ' + lunchHour + ')\\'>';
                            html += '<div class="card-hour-box" style="background: ' + lunchColor + '">' + lunchHour + '</div>';
                            html += '<div class="card-main"><div class="card-times"><span>' + (lunchObj.time.split('-')[0] || '') + '</span><span>' + (lunchObj.time.split('-')[1] || '') + '</span></div>';
                            html += '<div class="card-content"><div class="subject-line"><span style="color: ' + lunchColor + '">Oběd</span></div>';
                            html += '<div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">Rozklikni mě pro informace o menu.</div></div>';
                            html += '</div></div>';
                        }

                        app.innerHTML = html + '</div>';
                        return; 
                    }
                    
                    const byHour = {};
                    items.forEach(i => { if (!byHour[i.hour]) byHour[i.hour] = []; byHour[i.hour].push(i); });
                    
                    const hourNums = Object.keys(byHour).map(Number).sort((a,b) => a-b);
                    const minH = hourNums.length > 0 ? hourNums[0] : 5;
                    const maxH = hourNums.length > 0 ? hourNums[hourNums.length-1] : 5;
                    const finalHours = [];
                    let lunchAssigned = false;

                    for (let h = minH; h <= maxH; h++) {
                        finalHours.push(h);
                        if (!byHour[h]) {
                            const isLunch = !lunchAssigned && h >= 5 && h <= 7;
                            if (isLunch) lunchAssigned = true;
                            byHour[h] = [{
                                subject: (isLunch && menuText) ? 'Oběd <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-left: 4px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>' : 'Pauza',
                                time: HOUR_TIMES[h] || '',
                                room: '-',
                                teacher: '-',
                                theme: (isLunch && menuText) ? menuText : '',
                                date: selectedDay,
                                isPause: true
                            }];
                        }
                    }

                    if (!lunchAssigned && menuText && (isTeacher || maxH < 7)) {
                        const possibleLunchHours = [5, 6, 7].filter(h => h > maxH || !byHour[h]);
                        if (possibleLunchHours.length > 0) {
                            const lunchHour = possibleLunchHours[0];
                            finalHours.push(lunchHour);
                            byHour[lunchHour] = [{
                                subject: 'Oběd <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-left: 4px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>',
                                time: HOUR_TIMES[lunchHour] || '',
                                room: '-',
                                teacher: '-',
                                theme: menuText,
                                date: selectedDay,
                                isPause: true
                            }];
                            lunchAssigned = true;
                        }
                    }
                    finalHours.sort((a, b) => a - b);

                    let animClass = '';
                    if (prevWeek !== selectedWeek) {
                        animClass = 'fade-scale';
                    } else if (prevDay && selectedDay) {
                        const prevIdx = daysOrder.indexOf(prevDay);
                        const currIdx = daysOrder.indexOf(selectedDay);
                        if (currIdx > prevIdx) animClass = 'slide-right';
                        else if (currIdx < prevIdx) animClass = 'slide-left';
                    }
                    
                    prevDay = selectedDay;
                    prevWeek = selectedWeek;

                    let html = '<div class="grid-container ' + animClass + '">';
                    
                    if (dateStr) {
                        const [d, m] = dateStr.split('.').map(p => p.padStart(2, '0'));
                        const targetMD = m + '-' + d;
                        const dayNotes = notes.filter(n => n.date.endsWith(targetMD));
                        if (dayNotes.length > 0) {
                            html += '<div class="notes-section" style="margin-bottom: 15px;">';
                            dayNotes.forEach((n, idx) => {
                                html += '<div class="note-card ' + (n.isTest ? 'is-test' : '') + '" style="animation-delay: ' + (idx * 0.05) + 's">';
                                html += '<div style="flex: 1;">';
                                html += '<div class="note-subject">' + n.subject.toUpperCase() + (n.isTest ? ' (TEST)' : '') + '</div>';
                                if (n.text) html += '<div class="note-text">' + n.text + '</div>';
                                html += '</div>';
                                html += '<div class="note-delete" onclick="event.stopPropagation(); deleteNote(' + n.id + ')">✕</div>';
                                html += '</div>';
                            });
                            html += '</div>';
                        }
                    }
                    
                    let cardIdx = 0;
                    finalHours.forEach(h => {
                        byHour[h].forEach(l => {
                            const isNow = selectedWeek === 'actual' && checkIfNow(l);
                            let subjColor = getSubjectColor(l.subject);
                            let glowColor = subjColor;
                            if (glowColor.startsWith('hsl')) {
                                glowColor = glowColor.replace('hsl', 'hsla').replace(')', ', 0.08)');
                            } else if (glowColor.startsWith('#')) {
                                glowColor = glowColor + '14';
                            }
                            const times = l.time.split('-').map(t => t.trim());
                            const startTime = times[0] || '';
                            const endTime = times[1] || '';
                            const isNowClass = isNow ? 'is-now' : '';
                            const isChangedClass = l.change ? 'changed' : '';
                            const stats = absenceData[l.subject] || { absences: 0, total: 0 };
                            const percent = stats.total > 0 ? (stats.absences / stats.total) * 100 : 0;
                            let absenceClass = "";
                            if (percent >= 20) absenceClass = "high";
                            else if (percent >= 10) absenceClass = "medium";
                            else if (percent >= 0) absenceClass = "low";
                            const lessonData = JSON.stringify(l).replace(/'/g, "&#39;");
                            html += '<div class="lesson-card ' + isNowClass + ' ' + isChangedClass + '" style="position: relative; animation-delay: ' + (cardIdx * 0.05) + 's; background: linear-gradient(135deg, var(--card) 85%, ' + glowColor + ')" onclick=\\'showDetail(' + lessonData + ', ' + h + ')\\'>';
                            cardIdx++;                        
                            if (absenceClass && !l.isPause && !l.subject.includes('Oběd')) {
                                html += '<div class="absence-warning ' + absenceClass + '" title="Absence: ' + Math.round(percent) + '%"></div>';
                            }
                            html += '<div class="card-hour-box" style="background: ' + subjColor + '">';
                            html += h;
                            html += '</div>';
                            html += '<div class="card-main">';
                            html += '<div class="card-times">';
                            html += '<span>' + startTime + '</span>';
                            html += '<span>' + endTime + '</span>';
                            html += '</div>';
                            html += '<div class="card-content">';
                            html += '<div class="subject-line">';
                            html += '<span style="color: ' + subjColor + '">' + l.subject + '</span>';
                            if (l.room !== '-') {
                                html += '<span class="room-badge">' + l.room + '</span>';
                            }
                            html += '</div>';
                            if (l.subject.includes('Oběd')) {
                                html += '<div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">Rozklikni mě pro informace o menu.</div>';
                            }
                            html += '</div>';
                            const displayTeacher = (l.teacher && l.teacher !== '-') ? l.teacher : (selectedType === 'teacher' ? getEntityName(selectedId) : '-');
                            if (displayTeacher && displayTeacher !== '-') {
                                html += '<div class="teacher-initials" style="border-color: ' + subjColor + '; color: ' + subjColor + '">';
                                html += getInitials(displayTeacher);
                                html += '</div>';
                            }
                            html += '</div>';
                            html += '</div>';
                        });
                    });
                    app.innerHTML = html + '</div>';
                } catch (e) {
                    console.error("Render error:", e);
                    const app = document.getElementById('app');
                    if (app) app.innerHTML = '<div style="padding:20px; color:red;">Chyba při zobrazení dat.</div>';
                }
            }

            
            function checkIfNow(l) {
                if (!l.time || !l.date) return false;
                const now = getNow();
                const todayShort = daysOrder[now.getDay()-1];
                if (!todayShort || !l.date.startsWith(todayShort)) return false;
                const currentTotal = now.getHours() * 60 + now.getMinutes();
                const [start, end] = l.time.split('-').map(s => s.trim());
                return currentTotal >= getMins(start) && currentTotal <= getMins(end);
            }
            
            function processNow() {
                if (!fullData || selectedWeek !== 'actual') { 
                    const banner = document.getElementById('now-banner');
                    if (banner) banner.style.display = 'none';
                    return; 
                }
                const banner = document.getElementById('now-banner');
                const now = getNow();
                const curTotal = now.getHours() * 60 + now.getMinutes();
                if (now.getHours() < 6 || now.getHours() >= 17) { 
                    banner.style.display = 'none'; 
                    return; 
                }
                updateProcessedLessons();
                if (cachedDayLessons.length === 0) {
                    banner.style.display = 'none';
                    return;
                }
                const currentLessons = [];
                let nextMins = Infinity;
                const nextLessons = [];
                for (let i = 0; i < cachedDayLessons.length; i++) {
                    const l = cachedDayLessons[i];
                    if (!l.time) continue;
                    const [startStr, endStr] = l.time.split('-').map(s => s.trim());
                    const startMins = getMins(startStr);
                    const endMins = getMins(endStr);
                    if (curTotal >= startMins && curTotal <= endMins) {
                        currentLessons.push(l);
                    } else if (startMins > curTotal) {
                        if (startMins < nextMins) {
                            nextMins = startMins;
                            nextLessons.length = 0;
                            nextLessons.push(l);
                        } else if (startMins === nextMins) {
                            nextLessons.push(l);
                        }
                    }
                }
                if (currentLessons.length > 0) {
                    const cur = currentLessons[0];
                    const subjects = currentLessons.map(l => l.subject).join(' / ');
                    const rooms = currentLessons.map(l => l.room).join(' / ');
                    const [start, end] = cur.time.split('-').map(s => s.trim());
                    const minsLeft = getMins(end) - curTotal;
                    const totalMins = getMins(end) - getMins(start);
                    const passedMins = curTotal - getMins(start);
                    const pct = Math.min(100, Math.max(0, (passedMins / totalMins) * 100));
                    const pbHtml = '<div class="progress-bar" style="width:' + pct + '%;"></div>';
                    if (minsLeft <= 5 && nextLessons.length > 0) {
                        const nextSubjects = nextLessons.map(l => l.subject).join(' / ');
                        const nextRooms = nextLessons.map(l => l.room).join(' / ');
                        banner.innerHTML = 
                            '<div class="banner-split">' +
                                '<div class="banner-half">' +
                                    '<div class="banner-label">Končí za ' + minsLeft + ' min</div>' +
                                    '<div class="banner-subject">' + subjects + '</div>' +
                                    '<div class="banner-details">' + rooms + '</div>' +
                                '</div>' +
                                '<div class="banner-half">' +
                                    '<div class="banner-label">Následuje</div>' +
                                    '<div class="banner-subject">' + nextSubjects + '</div>' +
                                    '<div class="banner-details">' + nextLessons[0].time + ' | ' + nextRooms + '</div>' +
                                '</div>' +
                            '</div>' + pbHtml;
                        banner.className = 'is-split';
                        } else {
                        banner.innerHTML = 
                            '<div class="banner-content">' +
                                '<div class="banner-label">Právě probíhá</div>' +
                                '<div class="banner-subject">' + subjects + '</div>' +
                                '<div class="banner-details">' + cur.time + ' | ' + rooms + '</div>' +
                            '</div>' + pbHtml;
                        banner.className = '';
                        }
                        banner.style.display = banner.classList.contains('is-split') ? 'flex' : 'block';
                        } else if (nextLessons.length > 0) {
                        const nextSubjects = nextLessons.map(l => l.subject).join(' / ');
                        const nextRooms = nextLessons.map(l => l.room).join(' / ');
                        banner.innerHTML = 
                        '<div class="banner-content">' +
                            '<div class="banner-label">Následuje</div>' +
                            '<div class="banner-subject">' + nextSubjects + '</div>' +
                            '<div class="banner-details">' + nextLessons[0].time + ' | ' + nextRooms + '</div>' +
                        '</div>';
                        banner.className = 'is-break';
                        banner.style.display = 'block';                } else {
                    banner.style.display = 'none';
                }
                let title = '';
                let body = '';
                let tag = 'timetable-lesson';
                
                const cleanStr = (s) => s.replace(/<[^>]*>/g, '').trim();

                if (currentLessons.length > 0) {
                    const cur = currentLessons[0];
                    const subjects = currentLessons.map(l => cleanStr(l.subject).toUpperCase()).join(' / ');
                    const rooms = currentLessons.map(l => l.room).join(' / ');
                    const [start, end] = cur.time.split('-').map(s => s.trim());
                    const minsLeft = getMins(end) - curTotal;
                    if (minsLeft <= 5 && nextLessons.length > 0) {
                        const nextSubjects = nextLessons.map(l => cleanStr(l.subject).toUpperCase()).join(' / ');
                        const nextRooms = nextLessons.map(l => l.room).join(' / ');
                        title = rooms;
                        body = subjects + ' | ' + nextSubjects;
                    } else {
                        title = rooms;
                        body = subjects + ' | ' + cur.time;
                    }
                } else if (nextLessons.length > 0) {
                    const nextSubjects = nextLessons.map(l => cleanStr(l.subject).toUpperCase()).join(' / ');
                    const nextRooms = nextLessons.map(l => l.room).join(' / ');
                    title = nextRooms;
                    body = nextSubjects + ' | ' + nextLessons[0].time;
                } else {
                    const tomorrow = getNow();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowISO = tomorrow.toISOString().split('T')[0];
                    const tomorrowNotes = notes.filter(n => n.date === tomorrowISO);
                    if (tomorrowNotes.length > 0) {
                        const tests = tomorrowNotes.filter(n => n.isTest);
                        const other = tomorrowNotes.filter(n => !n.isTest);
                        title = 'Zítra vás čeká...';
                        body = '';
                        if (tests.length > 0) body += '⚠️ ' + tests.map(n => n.subject).join(', ') + '. ';
                        if (other.length > 0) body += '📝 ' + other.map(n => n.subject).join(', ');
                        tag = 'timetable-tomorrow';
                    }
                }
                window.currentNotification = { title, body, tag };
            }
            window.triggerManualNotification = function() {
                if (!window.currentNotification || !window.currentNotification.title) return;
                if (notificationsEnabled) {
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(reg => {
                            reg.showNotification(window.currentNotification.title, {
                                body: window.currentNotification.body,
                                tag: window.currentNotification.tag,
                                silent: false,
                                icon: getPngIcon(),
                                badge: getPngIcon(), 
                                renotify: true 
                            });
                        });
                    }
                } else {
                    alert('Oznámení jsou v nastavení vypnutá.');
                }
            };
`;
