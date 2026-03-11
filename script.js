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
    
    // כאן הוספנו את חצות וצאת הכוכבים
    const items = { 
        "sunrise": "נץ החמה", 
        "sofZmanShma": "סוף זמן ק\"ש", 
        "chatzot": "חצות היום/לילה",
        "sunset": "שקיעה",
        "tzeit7085deg": "צאת הכוכבים" 
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
    const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}`);
    const g = await gRes.json(); 
    if(!g.length) return alert("יעד לא נמצא");
    const dLat = g[0].lat, dLon = g[0].lon;
    
    const rRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`);
    const r = await rRes.json();
    const arr = new Date(Date.now() + r.routes[0].duration * 1000);
    
    const zRes = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${dLat}&longitude=${dLon}&il=on`);
    const z = await zRes.json(); 
    const sun = new Date(z.times.sunset);
    
    document.getElementById('arrTime').innerText = arr.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
    const diff = Math.floor((sun-arr)/60000);
    const diffElem = document.getElementById('diffTime');
    diffElem.innerText = diff + " דקות";
    diffElem.style.color = diff > 0 ? "green" : "red";
    
    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('wazeLink').href = `https://waze.com/ul?ll=${dLat},${dLon}&navigate=yes`;
}

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
    getZmanim(oLat,oLon,"ירושלים");
    if(localStorage.getItem('pref_bg')) updateStyle('bg', localStorage.getItem('pref_bg'));
};

if ('serviceWorker' in navigator) { 
    navigator.serviceWorker.register('sw.js'); 
}
