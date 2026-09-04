export const CLIENT_ONBOARDING = `
        function initOnboarding() {
            const hasSeenOnboarding = localStorage.getItem('onboarding_v4');
            if (hasSeenOnboarding) return;

            // Step 1: Hide everything else
            const style = document.createElement('style');
            style.id = 'onboarding-style';
            style.textContent = 'body > *:not(#onboarding-overlay):not(script):not(style) { display: none !important; } body { overflow: hidden !important; height: 100vh !important; background: #000; }';
            document.head.appendChild(style);

            const overlay = document.createElement('div');
            overlay.id = 'onboarding-overlay';
            
            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const bgColor = isDark ? '#000000' : '#ffffff';
            const textColor = isDark ? '#ffffff' : '#000000';
            const cardBg = isDark ? '#1c1c1e' : '#f2f2f7';
            const accent = '#007aff';

            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:' + bgColor + '; z-index:2000; display:flex; flex-direction:column; align-items:center; color:' + textColor + '; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding:60px 20px; box-sizing:border-box; transition: opacity 0.5s ease; overflow-y: auto;';

            let currentStep = 0;
            const onboardingData = {
                userName: '',
                selectedType: null, // Start with null, no default
                selectedId: null,
                hiddenGroups: [],
                groupsInitialized: false
            };

            const steps = [
                // 0: Name
                {
                    title: 'V\xEDtejte',
                    subtitle: 'Kdo bude pou\u017E\xEDvat rozvrh?',
                    render: (container) => {
                        const nameInput = document.createElement('input');
                        nameInput.type = 'text';
                        nameInput.placeholder = 'Va\u0161e jm\xE9no';
                        nameInput.value = onboardingData.userName;
                        nameInput.style.cssText = 'width:100%; max-width:300px; padding:18px; border:none; border-radius:14px; background:' + cardBg + '; color:' + textColor + '; font-size:19px; text-align:center; outline:none; transition: all 0.2s;';
                        nameInput.oninput = (e) => {
                            onboardingData.userName = e.target.value.trim();
                            const btn = document.getElementById('onboarding-next-btn');
                            if (btn) {
                                const isValid = onboardingData.userName.length > 0;
                                btn.style.background = isValid ? accent : cardBg;
                                btn.style.color = isValid ? 'white' : (isDark ? '#444' : '#ccc');
                            }
                        };
                        container.appendChild(nameInput);
                        setTimeout(() => nameInput.focus(), 600);
                    },
                    validate: () => onboardingData.userName.length > 0
                },
                // 1: User Type
                {
                    title: 'Role',
                    subtitle: 'Vyberte svou roli ve \u0161kole.',
                    render: (container) => {
                        const group = document.createElement('div');
                        group.style.cssText = 'display:flex; flex-direction:column; gap:12px; width:100%; max-width:300px;';
                        
                        [
                            { label: 'Student', val: 'class' },
                            { label: 'U\u010Ditel', val: 'teacher' }
                        ].forEach(item => {
                            const btn = document.createElement('div');
                            const isActive = onboardingData.selectedType === item.val;
                            
                            btn.style.cssText = 'padding:20px; border-radius:16px; background:' + cardBg + '; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition: transform 0.1s, border 0.2s; border: 2px solid ' + (isActive ? accent : 'transparent');
                            btn.innerHTML = '<span style="font-weight:500;">' + item.label + '</span>' + (isActive ? '<span style="color:' + accent + '; font-weight:bold;">\u2714</span>' : '');
                            
                            btn.onclick = () => {
                                onboardingData.selectedType = item.val;
                                renderContent();
                                setTimeout(nextStep, 300);
                            };
                            group.appendChild(btn);
                        });
                        container.appendChild(group);
                    },
                    validate: () => onboardingData.selectedType !== null
                },
                // 2: Dynamic Selection (Class or Teacher)
                {
                    title: () => onboardingData.selectedType === 'class' ? 'T\u0159\xEDda' : 'Vyu\u010Duj\xEDc\xED',
                    subtitle: () => onboardingData.selectedType === 'class' ? 'Kterou t\u0159\xEDdu nav\u0161t\u011Bvujete?' : 'Vyberte své jm\xE9no ze seznamu.',
                    render: (container) => {
                        if (!fullData || !fullData.discovery) {
                            container.innerHTML = '<div style="padding:20px; text-align:center;"><div class="spinner"></div><p style="margin-top:10px;">Na\u010D\xEDt\xE1m seznam...</p></div>';
                            return;
                        }

                        const list = onboardingData.selectedType === 'class' ? fullData.discovery.classes : fullData.discovery.teachers;
                        
                        const wrapper = document.createElement('div');
                        wrapper.style.cssText = 'width:100%; max-width:350px;';
                        
                        const grid = document.createElement('div');
                        grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:10px; max-height: 50vh; overflow-y: auto; padding-right: 5px;';

                        list.forEach(item => {
                            const isActive = onboardingData.selectedId === item.id;
                            const btn = document.createElement('div');
                            btn.style.cssText = 'padding:15px 5px; border-radius:12px; background:' + cardBg + '; text-align:center; cursor:pointer; transition: border 0.2s; border: 2px solid ' + (isActive ? accent : 'transparent');
                            btn.innerHTML = '<div style="font-weight:600; font-size:14px; line-height:1.2;">' + item.name + '</div>';
                            
                            btn.onclick = () => {
                                onboardingData.selectedId = item.id;
                                onboardingData.groupsInitialized = false;
                                onboardingData.hiddenGroups = [];
                                renderContent();
                                
                                // For teachers, we can skip groups
                                if (onboardingData.selectedType === 'teacher') {
                                    setTimeout(finishOnboarding, 400);
                                } else {
                                    // Show a quick loading state while we fetch the timetable
                                    const nextBtn = document.getElementById('onboarding-next-btn');
                                    if (nextBtn) nextBtn.innerHTML = '<div class="spinner" style="width:20px; height:20px; border-width:2px;"></div>';

                                    fetch('/api/timetable?type=class&id=' + item.id + '&t=' + Date.now())
                                    .then(r => r.json())
                                    .then((data) => {
                                        fullData = data; // Update global fullData so Step 3 can see the groups
                                        setTimeout(nextStep, 300);
                                    })
                                    .catch(() => {
                                        setTimeout(nextStep, 300);
                                    });
                                }
                            };
                            grid.appendChild(btn);
                        });
                        wrapper.appendChild(grid);
                        container.appendChild(wrapper);
                    },
                    validate: () => onboardingData.selectedId !== null
                },
                // 3: Subject Groups (Only for students)
                {
                    title: 'Skupiny',
                    subtitle: 'Vyberte p\u0159edm\u011Bty, kter\xE9 m\xE1te.',
                    render: (container) => {
                        const wrapper = document.createElement('div');
                        wrapper.style.cssText = 'width:100%; max-width:350px; text-align:left;';
                        
                        const groupsSet = new Set();
                        if (!onboardingData.selectedId) return;
                        const id = onboardingData.selectedId.toLowerCase();
                        if (fullData && fullData[id]) {
                            ['actual', 'next'].forEach(wk => {
                                if (fullData[id][wk]) {
                                    fullData[id][wk].items.forEach(i => {
                                        // Normalize empty group to "-" for mandatory subjects
                                        const g = (i.group || "-").trim();
                                        groupsSet.add(g);
                                    });
                                }
                            });
                        }

                        const groups = Array.from(groupsSet);
                        if (!onboardingData.groupsInitialized && groups.length > 0) {
                            // Default to all hidden (NOT selected)
                            onboardingData.hiddenGroups = [...groups]; 
                            onboardingData.groupsInitialized = true;
                        }

                        if (groups.length === 0) {
                            wrapper.innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px;">V t\xE9to t\u0159\xEDd\u011B nebyly nalezeny \u017E\xE1dn\xE9 voliteln\xE9 skupiny.</p>';
                        } else {
                            const scrollArea = document.createElement('div');
                            scrollArea.style.cssText = 'max-height: 50vh; overflow-y: auto; border-radius:16px; padding:0;';
                            
                            const subjectList = [];
                            
                            groups.forEach(g => {
                                let displayName = g;

                                // Find a real lesson to get full subject name and teacher
                                if (fullData && fullData[id]) {
                                    let foundItem = null;
                                    ['actual', 'next'].forEach(wk => {
                                        if (!foundItem && fullData[id][wk]) {
                                            foundItem = fullData[id][wk].items.find(i => (i.group || "-").trim() === g);
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

                            const groupList = document.createElement('div');
                            groupList.style.cssText = 'background:' + cardBg + '; border-radius:16px; margin-bottom:16px; overflow:hidden;';

                            subjectList.forEach(item => {
                                const g = item.id;
                                const displayName = item.name;

                                const row = document.createElement('div');
                                row.style.cssText = 'padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(128,128,128,0.1); cursor:pointer;';
                                
                                const updateCheck = (el, hidden) => {
                                    el.innerHTML = '<div style="width:24px; height:24px; border-radius:50%; border:2px solid ' + accent + '; display:flex; align-items:center; justify-content:center; background:' + (!hidden ? accent : 'transparent') + ';">' + (!hidden ? '<span style="color:white; font-size:12px;">\u2714</span>' : '') + '</div>';
                                };

                                row.innerHTML = '<span style="font-size:16px; font-weight:500;">' + displayName + '</span><div class="check-container"></div>';
                                const checkContainer = row.querySelector('.check-container');
                                updateCheck(checkContainer, onboardingData.hiddenGroups.includes(g));
                                
                                row.onclick = () => {
                                    if (onboardingData.hiddenGroups.includes(g)) onboardingData.hiddenGroups = onboardingData.hiddenGroups.filter(x => x !== g);
                                    else onboardingData.hiddenGroups.push(g);
                                    updateCheck(checkContainer, onboardingData.hiddenGroups.includes(g));
                                };
                                groupList.appendChild(row);
                            });
                            scrollArea.appendChild(groupList);
                            wrapper.appendChild(scrollArea);
                        }
                        container.appendChild(wrapper);
                    },
                    shouldShow: () => onboardingData.selectedType === 'class'
                }
            ];

            const renderContent = () => {
                overlay.innerHTML = '';
                
                const icon = document.createElement('div');
                icon.style.cssText = 'width:80px; height:80px; margin-bottom:30px; border-radius:18px; background:' + accent + '; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 20px rgba(0,0,0,0.1); flex-shrink:0; overflow:hidden;';
                const img = document.createElement('img');
                img.src = '/assets/web-app-manifest-192x192.png';
                img.style.width = '100%';
                img.onerror = () => icon.innerHTML = '<span style="font-size:40px;">\u{1F4C5}</span>';
                icon.appendChild(img);
                overlay.appendChild(icon);

                const step = steps[currentStep];
                const t = document.createElement('h1');
                t.textContent = typeof step.title === 'function' ? step.title() : step.title;
                t.style.cssText = 'font-size:34px; font-weight:700; margin:0 0 8px 0; letter-spacing:-0.5px;';
                overlay.appendChild(t);

                if (step.subtitle) {
                    const st = document.createElement('p');
                    st.textContent = typeof step.subtitle === 'function' ? step.subtitle() : step.subtitle;
                    st.style.cssText = 'font-size:17px; opacity:0.6; margin:0 0 40px 0;';
                    overlay.appendChild(st);
                }

                const contentArea = document.createElement('div');
                contentArea.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                step.render(contentArea);
                overlay.appendChild(contentArea);

                const dots = document.createElement('div');
                dots.style.cssText = 'display:flex; gap:8px; margin-top:40px; margin-bottom:20px;';
                steps.forEach((s, i) => {
                    if (s.shouldShow && !s.shouldShow()) return;
                    const dot = document.createElement('div');
                    dot.style.cssText = 'width:8px; height:8px; border-radius:50%; background:' + (i === currentStep ? accent : cardBg) + '; transition: background 0.3s;';
                    dots.appendChild(dot);
                });
                overlay.appendChild(dots);

                const nav = document.createElement('div');
                nav.style.cssText = 'width:100%; max-width:300px; display:flex; gap:12px; margin-top:auto; padding-bottom:env(safe-area-inset-bottom, 20px);';
                
                if (currentStep > 0) {
                    const back = document.createElement('button');
                    back.textContent = 'Zp\u011Bt';
                    back.style.cssText = 'flex:1; padding:18px; background:' + cardBg + '; color:' + textColor + '; border:none; border-radius:14px; font-size:17px; font-weight:600; cursor:pointer;';
                    back.onclick = () => { currentStep--; renderContent(); };
                    nav.appendChild(back);
                }

                const next = document.createElement('button');
                next.id = 'onboarding-next-btn';
                const isValid = !step.validate || step.validate();
                next.textContent = (currentStep === steps.length - 1 || (onboardingData.selectedType === 'teacher' && currentStep === 2)) ? 'Dokon\u010Dit' : 'Pokra\u010Dovat';
                next.style.cssText = 'flex:2; padding:18px; background:' + (isValid ? accent : cardBg) + '; color:' + (isValid ? 'white' : (isDark ? '#444' : '#ccc')) + '; border:none; border-radius:14px; font-size:17px; font-weight:600; cursor:pointer; transition: all 0.3s;';
                next.onclick = nextStep;
                nav.appendChild(next);
                overlay.appendChild(nav);
            };

            const nextStep = () => {
                if (steps[currentStep].validate && !steps[currentStep].validate()) return;
                
                let next = currentStep + 1;
                while(next < steps.length && steps[next].shouldShow && !steps[next].shouldShow()) {
                    next++;
                }

                if (next < steps.length) {
                    currentStep = next;
                    renderContent();
                } else {
                    finishOnboarding();
                }
            };

            const finishOnboarding = () => {
                localStorage.setItem('userName', onboardingData.userName);
                localStorage.setItem('selectedType', onboardingData.selectedType);
                localStorage.setItem('selectedId', onboardingData.selectedId);
                localStorage.setItem('hiddenGroups', JSON.stringify(onboardingData.hiddenGroups));
                localStorage.setItem('onboarding_v4', 'true');
                
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    const s = document.getElementById('onboarding-style');
                    if (s) s.remove();
                    window.location.reload(); 
                }, 500);
            };

            document.body.appendChild(overlay);
            renderContent();

            // Handle potential late loading of fullData
            const checkDataInterval = setInterval(() => {
                if (fullData && fullData.discovery && currentStep === 2) {
                    renderContent();
                    clearInterval(checkDataInterval);
                }
            }, 500);
        }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initOnboarding);
        else initOnboarding();
    `;
