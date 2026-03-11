let oLat = 31.76, oLon = 35.21;

async function getZmanim(lat, lon, n) {
    document.getElementById('locName').innerText = n;
    const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&il=on`);
    const data = await res.json();
    const z = data.times;

    // הגדרת הזמנים להצגה
    const items = [
        { id: "alotHaShachar", label: "עלות השחר" },
        { id: "sunrise", label: "נץ החמה" },
        { id: "sofZmanShmaMGA", label: "סוף זמן שמע (מג\"א)" },
        { id: "sofZmanShma", label: "סוף זמן שמע (גר\"א)" },
        { id: "sunset", label: "שקיעת החמה" },
        { id: "tzeit7080", label: "צאת הכוכבים" }, // זה הזמן הקריטי עבורך
        { id: "tzeit42", label: "צאת הכוכבים (ר\"ת)" }
    ];

    let html = '';
    let tzeitFound = null;

    // מעבר על הרשימה והצגת הזמנים
    items.forEach(item => {
        if (z[item.id]) {
            const timeVal = new Date(z[item.id]);
            const tStr = timeVal.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
            html += `<div class="time-row"><span>${item.label}</span><span class="value">${tStr}</span></div>`;
            
            // שומרים את צאת הכוכבים (7.08) לחישוב חצות
            if (item.id === "tzeit7080") tzeitFound = timeVal;
        }
    });

    // חישוב חצות (6 ו-8 שעות בדיוק אחרי צאת הכוכבים)
    if (tzeitFound) {
        const chatzotStart = new Date(tzeitFound.getTime() + (6 * 60 * 60 * 1000));
        const chatzotEnd = new Date(tzeitFound.getTime() + (8 * 60 * 60 * 1000));

        html += `<div class="time-row" style="background: #fff9c4; border: 1px solid #fbc02d; margin-top: 10px; padding: 5px; border-radius: 5px;"><span><b>חצות (רבי נחמן)</b></span><span class="value">${chatzotStart.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
        html += `<div class="time-row" style="background: #fff9c4; border: 1px solid #fbc02d; border-top: none; padding: 5px; border-radius: 5px;"><span>סוף חצות</span><span class="value">${chatzotEnd.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span></div>`;
    }

    document.getElementById('zmanimList').innerHTML = html;
}

// שאר הפונקציות נשארות ללא שינוי
async function fetchInfo() { try { const dateRes = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${new Date().getFullYear()}&gm=${new Date().getMonth()+1}&gd=${new Date().getDate()}&g2h=1`); const d = await dateRes.json(); document.getElementById('hebrewDateDisplay').innerText = d.hebrew; const pRes = await fetch('https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&year=now&month=now&il=on'); const pData = await pRes.json(); const p = pData.items.find(i => i.category === "parashat"); if(p) document.getElementById('parashaDisplay').innerText = "פרשת " + p.hebrew; } catch(e) {} }
function updateStyle(p, v, s) { document.documentElement.style.setProperty('--' + p, v); if(s) localStorage.setItem('pref_'+p, v); }
function toggleSettings() { const s = document.getElementById('settingsPanel'); s.style.display = s.style.display==='block'?'none':'block'; }
window.onload = () => { fetchInfo(); getZmanim(oLat,oLon,"ירושלים"); if(localStorage.getItem('pref_bg')) updateStyle('bg', localStorage.getItem('pref_bg')); };
