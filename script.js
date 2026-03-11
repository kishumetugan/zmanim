let oLat = 31.76, oLon = 35.21;

function updateStyle(p, v, s) { 
    document.documentElement.style.setProperty('--' + p, v); 
    if(s) localStorage.setItem('pref_'+p, v); 
}

async function fetchInfo() {
    try {
        const dateRes = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${new Date().getFullYear()}&gm=${new Date().getMonth()+1}&gd=${new Date().getDate()}&g2h=1`);
        const d = await dateRes.json(); document.getElementById('hebrewDateDisplay').innerText = d.hebrew;
        const pRes = await fetch('https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&year=now&month=now&il=on');
        const pData = await pRes.json();
        const p = pData.items.find(i => i.category === "parashat");
        if(p) document.getElementById('parashaDisplay').innerText = "פרשת " + p.hebrew;
    } catch(e) {}
}

async function getZmanim(lat, lon, n) {
    document.getElementById('locName').innerText = n;
    const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&il=on`);
    const data = await res.json();
    const z = data.times;

    // רשימת הזמנים להצגה (כולל עלות השחר וצאת הכוכבים)
    const items = {
        "alotHaShachar": "עלות השחר",
        "sunrise": "נץ החמה",
        "sofZmanShmaMGA": "סוף זמן שמע (מג\"א)",
        "sofZmanShma": "סוף זמן שמע (גר\"א)",
        "sunset": "שקיעת החמה",
        "tzeit7080": "צאת הכוכבים",
        "tzeit42": "צאת הכוכבים (ר\"ת)"
    };

    let html = '';
    for(let k in items) {
        if(z[k]) {
            const t = new Date(z[k]).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
            html += `<div class="time-row"><span>${items[k]}</span><span class="value">${t}</span></div>`;
        }
    }

    // חישוב חצות לפי רבי נחמן (6 ו-8 שעות מצאת הכוכבים)
    if(z.tzeit7080) {
        const tzeitDate = new Date(z.tzeit7080);
        
        // תחילת חצות (6 שעות אחרי צאת הכוכבים)
        const chatzotStart = new Date(tzeitDate.getTime() + (6 * 60 * 60 * 1000));
        const chatzotStartStr = chatzotStart.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
        
        // סוף חצות (8 שעות אחרי צאת הכוכבים)
        const chatzotEnd = new Date(tzeitDate.getTime() + (8 * 60 * 60 * 1000));
        const chatzotEndStr = chatzotEnd.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});

        html += `<div class="time-row" style="background: #fff8e1; border-radius: 5px; margin-top: 5px; border: 1px solid #ffe082;"><span><b>חצות (רבי נחמן)</b></span><span class="value">${chatzotStartStr}</span></div>`;
        html += `<div class="time-row" style="background: #fff8e1; border-radius: 5px; border: 1px solid #ffe082; border-top: none;"><span>סוף חצות</span><span class="value">${chatzotEndStr}</span></div>`;
    }

    document.getElementById('zmanimList').innerHTML = html;
}

async function calculate() {
    const dest = document.getElementById('destInput').value;
    if(!dest) return alert("הזן יעד");
    const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
    const g = await gRes.json(); 
    if(!g.length) return alert("יעד לא נמצא");
    const dLat = g[0].lat, dLon = g[0].lon;
    
    const rRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`);
    const r = await rRes.json();
    const arr = new Date(Date.now() + r.routes[0].duration * 1000);
    
    const zRes = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${dLat}&longitude=${dLon}&il=on`);
    const z = await zRes.json(); const sun = new Date(z.times.sunset);
    
    document.getElementById('arrTime').innerText = arr.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
    document.getElementById('diffTime').innerText = Math.floor((sun-arr)/60000) + " דקות";
    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('wazeLink').href = `https://waze.com/ul?ll=${dLat},${dLon}&navigate=yes`;
}

function initGPS() { 
    navigator.geolocation.getCurrentPosition(p => { 
        oLat=p.coords.latitude; oLon=p.coords.longitude; 
        getZmanim(oLat,oLon,"המיקום שלך"); 
    }); 
}

function toggleSettings() { 
    const s = document.getElementById('settingsPanel'); 
    s.style.display = s.style.display==='block'?'none':'block'; 
}

window.onload = () => { 
    fetchInfo(); getZmanim(oLat,oLon,"ירושלים");
    if(localStorage.getItem('pref_bg')) updateStyle('bg', localStorage.getItem('pref_bg'));
};

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
