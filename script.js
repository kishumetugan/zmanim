let oLat = 31.76, oLon = 35.21;

// עדכון עיצוב (גודל כתב וצבע רקע)
function updateStyle(p, v, s) { 
    document.documentElement.style.setProperty('--' + p, v); 
    if(s) localStorage.setItem('pref_'+p, v); 
}

// שליפת תאריך עברי ופרשה
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

// הצגת זמני היום (כולל עלות השחר וצאת הכוכבים)
async function getZmanim(lat, lon, n) {
    try {
        document.getElementById('locName').innerText = n;
        const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&il=on`);
        const data = await res.json();
        
        const items = { 
            "alotHaShachar": "עלות השחר", 
            "sunrise": "נץ החמה", 
            "sofZmanShma": "סוף זמן ק\"ש", 
            "chatzot": "חצות היום",
            "sunset": "שקיעה",
            "tzeit7085deg": "צאת הכוכבים" 
        };
        
        let html = '';
        for(let k in items) {
            if(data.times[k]) {
                const t = new Date(data.times[k]).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
                html += `<div class="time-row" style="display:flex; justify-content:space-between; margin: 5px 0; border-bottom:1px solid #eee;"><span>${items[k]}</span><span class="value" style="font-weight:bold;">${t}</span></div>`;
            }
        }
        document.getElementById('zmanimList').innerHTML = html;
    } catch(e) { console.error("Error in getZmanim", e); }
}

// פונקציה חדשה לטיפול בבחירת עיר מהרשימה
function changeCity() {
    const select = document.getElementById('citySelect');
    const val = select.value;
    const name = select.options[select.selectedIndex].text; // שואב את שם העיר מהטקסט של האופציה
    
    const coords = val.split(',');
    oLat = parseFloat(coords[0]);
    oLon = parseFloat(coords[1]);
    
    getZmanim(oLat, oLon, name);
}

// חישוב הגעה ליעד מול צאת הכוכבים
async function calculate() {
    const dest = document.getElementById('destInput').value;
    if(!dest) return alert("הזן יעד");
    
    try {
        // גיאוקודינג ליעד
        const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
        const g = await gRes.json(); 
        if(!g.length) return alert("יעד לא נמצא");
        const dLat = g[0].lat, dLon = g[0].lon;
        
        // חישוב מסלול
        const rRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`);
        const r = await rRes.json();
        const duration = r.routes[0].duration; // בשניות
        const arr = new Date(Date.now() + duration * 1000);
        
        // שליפת זמנים ליעד (בשביל צאת הכוכבים שם)
        const zRes = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${dLat}&longitude=${dLon}&il=on`);
        const z = await zRes.json(); 
        const tzeit = new Date(z.times.tzeit7085deg);
        
        document.getElementById('arrTime').innerText = arr.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
        
        const diff = Math.floor((tzeit - arr) / 60000); // הפרש בדקות
        const diffElem = document.getElementById('diffTime');
        
        if (diff > 0) {
            diffElem.innerText = `נשארו עוד ${diff} דקות לצאת הכוכבים`;
            diffElem.style.color = "green";
        } else {
            diffElem.innerText = `איחור של ${Math.abs(diff)} דקות מצאת הכוכבים`;
            diffElem.style.color = "red";
        }
        
        document.getElementById('resultBox').style.display = 'block';
        document.getElementById('wazeLink').href = `https://waze.com/ul?ll=${dLat},${dLon}&navigate=yes`;
    } catch (e) {
        console.error(e);
        alert("שגיאה בחישוב המידע. נסה שנית.");
    }
}

// הפעלת GPS
function initGPS() { 
    navigator.geolocation.getCurrentPosition(p => { 
        oLat=p.coords.latitude; oLon=p.coords.longitude; 
        getZmanim(oLat,oLon,"המיקום שלך"); 
    }, () => alert("לא ניתן לגשת למיקום")); 
}

function toggleSettings() { 
    const s = document.getElementById('settingsPanel'); 
    s.style.display = s.style.display==='block'?'none':'block'; 
}

window.onload = () => { 
    fetchInfo(); 
    getZmanim(oLat, oLon, "ירושלים");
    if(localStorage.getItem('pref_bg')) updateStyle('bg', localStorage.getItem('pref_bg'));
};
