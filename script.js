let oLat = 31.76, oLon = 35.21;

function updateStyle(p, v, s) { 
    document.documentElement.style.setProperty('--' + p, v); 
    if(s) localStorage.setItem('pref_'+p, v); 
}

async function fetchInfo() {
    try {
        const dRes = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${new Date().getFullYear()}&gm=${new Date().getMonth()+1}&gd=${new Date().getDate()}&g2h=1`);
        const d = await dRes.json(); 
        document.getElementById('hebrewDateDisplay').innerText = d.hebrew;
        
        const pRes = await fetch('https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&year=now&month=now');
        const pData = await pRes.json();
        const p = pData.items.find(i => i.category === "parashat");
        if(p) document.getElementById('parashaDisplay').innerText = "פרשת " + p.hebrew;
    } catch(e) { console.error("Error fetching info", e); }
}

async function getZmanim(lat, lon, n) {
    document.getElementById('locName').innerText = n;
    const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&il=on`);
    const data = await res.json();
    
    // מפת הזמנים המעודכנת עם עלות השחר וצאת הכוכבים
    const items = { 
        "alotHaShachar": "עלות השחר", // נוסף
        "sunrise": "נץ החמה", 
        "sofZmanShma": "סוף זמן ק\"ש", 
        "chatzot": "חצות היום",
        "sunset": "שקיעה",
        "tzeit7085deg": "צאת הכוכבים" // הוסף/וודא שקיים
    };
    
    let html = '';
    for(let k in items) {
        if(data.times[k]) {
            const t = new Date(data.times[k]).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
            html += `<div class="time-row"><span>${items[k]}</span><span class="value">${t}</span></div>`;
        }
    }
    document.getElementById('zmanimList').innerHTML = html;
}

async function calculate() {
    const dest = document.getElementById('destInput').value;
    if(!dest) return alert("הזן יעד");
    
    try {
        const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
        const g = await gRes.json(); 
        if(!g.length) return alert("יעד לא נמצא");
        const dLat = g[0].lat, dLon = g[0].lon;
        
        const rRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`);
        const r = await rRes.json();
        const arr = new Date(Date.now() + r.routes[0].duration * 1000);
        
        const zRes = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${dLat}&longitude=${dLon}&il=on`);
        const z = await zRes.json(); 
        
        // כאן שיניתי לבדיקה מול צאת הכוכבים ביעד במקום שקיעה (לבחירתך)
        const tzeit = new Date(z.times.tzeit7085deg);
        
        document.getElementById('arrTime').innerText = arr.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
        
        const diff = Math.floor((tzeit - arr) / 60000);
        const diffElem = document.getElementById('diffTime');
        
        diffElem.innerText = (diff > 0 ? "נשארו עוד " : "איחור של ") + Math.abs(diff) + " דקות לצאת הכוכבים";
        diffElem.style.color = diff > 0 ? "green" : "red";
        
        document.getElementById('resultBox').style.display = 'block';
        document.getElementById('wazeLink').href = `https://waze.com/ul?ll=${dLat},${dLon}&navigate=yes`;
    } catch (e) {
        alert("שגיאה בחישוב המסלול");
    }
}

// שאר הפונקציות ללא שינוי (initGPS, toggleSettings, window.onload...)
