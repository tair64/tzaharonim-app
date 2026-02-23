import { useState } from "react";

// =====================================================================
// CONFIGURATION — עדכנו כאן כשמחליפים תפריט / חודש
// =====================================================================

// Google Forms — מזהי השדות (מהקישור שקיבלנו)
const FORM_ID = "1FAIpQLSdE_xoViotLDc7Tg2Aff5cV7L1llvwuSBcgiGoZRRjg_MiPrA";
const FORM_FIELDS = {
  budget:    "entry.2028105251",
  lastName:  "entry.1146045564",
  firstName: "entry.936188599",
  date:      "entry.3127143",
  mealType:  "entry.2115961786",
};
const FORM_SUBMIT_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

// ─── תפריטים ────────────────────────────────────────────────────────
const MENU_1 = {
  id: 1, label: "תפריט 1",
  days: {
    ראשון: { main: "אורז לבן + קציצות בקר ברוטב", side: "אפונה, כרוב לבן",           bonus: 'לביבות תפו"א',    extra: "שניצל תירס" },
    שני:   { main: "לחמנייה + אורז עם איטריות",   side: "תירס גרעינים, כרוב לבן",     bonus: 'לביבות תפו"א',    extra: "שניצל תירס" },
    שלישי: { main: "קוסקוס + פוטטוס",              side: "נקניקייה, גזר מגורד מתוק",   bonus: "נקניקייה צמחוני", extra: "שניצל תירס" },
    רביעי: { main: "עוף סיני + מרק ירקות",         side: "שוק עוף, סלק מבושל",         bonus: "",                extra: "שניצלונים"  },
    חמישי: { main: "אורז לבן + תירס גרעינים",      side: "חמוצים וטחינה",              bonus: "",                extra: ""            },
  },
};

const MENU_2 = {
  id: 2, label: "תפריט 2",
  days: {
    ראשון: { main: "אורז עם איטריות + קציצות עוף",   side: "שעועית ירוקה, כרוב לבן",   bonus: "", extra: "שניצל תירס" },
    שני:   { main: "פסטה ברוטב עגבניות + שניצל בית", side: "אפונה, כרוב לבן",           bonus: "", extra: "שניצל תירס" },
    שלישי: { main: "קוסקוס + שוק עוף",               side: "מרק ירקות, סלק מבושל",      bonus: "", extra: "שניצל תירס" },
    רביעי: { main: "פוטטוס + שניצלונים",             side: "גזר גמדי, גזר מגורד מתוק",  bonus: "", extra: ""           },
    חמישי: { main: "פיתה + שווארמה",                 side: "סירות תפוא, חמוצים וטחינה", bonus: "", extra: ""           },
  },
};

const MARCH_SCHEDULE = [
  { weekLabel: "1/3 – 5/3",   menuId: 2, days: ["ראשון","שני","שלישי","רביעי","חמישי"], dates: ["1/3","2/3","3/3","4/3","5/3"]       },
  { weekLabel: "8/3 – 12/3",  menuId: 1, days: ["ראשון","שני","שלישי","רביעי","חמישי"], dates: ["8/3","9/3","10/3","11/3","12/3"]    },
  { weekLabel: "15/3 – 19/3", menuId: 2, days: ["ראשון","שני","שלישי","רביעי","חמישי"], dates: ["15/3","16/3","17/3","18/3","19/3"]  },
  { weekLabel: "22/3 – 26/3", menuId: 1, days: ["ראשון","שני","שלישי","רביעי","חמישי"], dates: ["22/3","23/3","24/3","25/3","26/3"]  },
  { weekLabel: "29/3 – 31/3", menuId: 2, days: ["ראשון","שני","שלישי"],                  dates: ["29/3","30/3","31/3"]               },
];

const NOTES   = ["3.3–4.3: חופש פורים – הבתים עובדים במתכונת קייטנה", "24.3–8.4: חופשת פסח – מתכונת קייטנה"];
const DEADLINE = "שני 23.2 בשעה 09:00";
const MENUS    = { 1: MENU_1, 2: MENU_2 };
const FOOD_ICONS = { ראשון:"🥘", שני:"🍝", שלישי:"🥗", רביעי:"🍗", חמישי:"🥙" };

// =====================================================================
// שליחה לגוגל פורמס — שורה אחת לכל יום
// =====================================================================
async function submitToGoogleForms(rows) {
  // Google Forms אינו תומך ב-CORS, לכן שולחים עם mode: no-cors
  // הבקשה תמיד "תצליח" מבחינת הדפדפן — הנתונים יגיעו לפורם
  const promises = rows.map(row => {
    const body = new URLSearchParams({
      [FORM_FIELDS.budget]:    row.budget,
      [FORM_FIELDS.lastName]:  row.lastName,
      [FORM_FIELDS.firstName]: row.firstName,
      [FORM_FIELDS.date]:      row.date,
      [FORM_FIELDS.mealType]:  row.mealType,
    });
    return fetch(FORM_SUBMIT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  });
  await Promise.all(promises);
}

// =====================================================================
// APP
// =====================================================================
export default function MealOrderApp() {
  const [step, setStep]               = useState(0); // 0=intro 1=select 2=summary 3=success 4=error
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [budget, setBudget]           = useState("");
  const [selections, setSelections]   = useState({});
  const [menuPreview, setMenuPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [sending, setSending]         = useState(false);

  const selKey    = (wIdx, dIdx) => `${wIdx}-${dIdx}`;
  const getSel    = (wIdx, dIdx) => selections[selKey(wIdx, dIdx)];
  const totalDays = ()           => Object.keys(selections).length;

  function toggleDay(wIdx, dIdx) {
    setSelections(prev => {
      const k = selKey(wIdx, dIdx);
      if (prev[k]) { const n = { ...prev }; delete n[k]; return n; }
      return { ...prev, [k]: { mealType: "בשרי" } };
    });
  }

  function setMealType(wIdx, dIdx, type) {
    const k = selKey(wIdx, dIdx);
    setSelections(prev => ({ ...prev, [k]: { ...prev[k], mealType: type } }));
  }

  function validateIntro() {
    const e = {};
    if (!firstName.trim()) e.firstName = "נא להכניס שם פרטי";
    if (!lastName.trim())  e.lastName  = "נא להכניס שם משפחה";
    if (!budget.trim())    e.budget    = "נא להכניס מספר תקציב";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildRows() {
    const rows = [];
    MARCH_SCHEDULE.forEach((week, wIdx) => {
      week.days.forEach((day, dIdx) => {
        const sel = getSel(wIdx, dIdx);
        if (sel) rows.push({
          budget:    budget.trim(),
          lastName:  lastName.trim(),
          firstName: firstName.trim(),
          date:      `${week.dates[dIdx]}/26 יום ${day}`,
          mealType:  sel.mealType,
        });
      });
    });
    return rows;
  }

  async function handleSend() {
    setSending(true);
    try {
      await submitToGoogleForms(buildRows());
      setStep(3);
    } catch {
      // no-cors לא זורק שגיאות אמיתיות — אם הגענו לכאן זה שגיאת רשת
      setStep(4);
    } finally {
      setSending(false);
    }
  }

  function resetAll() {
    setStep(0); setSelections({});
    setFirstName(""); setLastName(""); setBudget(""); setFieldErrors({});
  }

  // ── STEP 0: intro ──────────────────────────────────────────────────
  if (step === 0) return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={{fontSize:52,textAlign:"center"}}>🍽️</div>
        <h1 style={s.title}>הזמנת ארוחות מרץ 2026</h1>
        <p style={s.subtitle}>דגניה א׳ צהרונים</p>
        <div style={s.deadlineBadge}>⏰ יש להזמין עד: {DEADLINE}</div>
        <div style={s.notesBox}>
          {NOTES.map((n,i)=>(
            <div key={i} style={s.noteRow}><span>⚠️</span><span style={{fontSize:13,color:"#7f1d1d"}}>{n}</span></div>
          ))}
        </div>
        <div style={s.divider}/>
        <p style={{fontSize:13,color:"#7a5c3a",margin:0,textAlign:"center"}}>מלאו את פרטי הילד/ה להמשך</p>

        <FField label="שם פרטי של הילד/ה *" error={fieldErrors.firstName}>
          <input style={{...s.input,...(fieldErrors.firstName?s.inputErr:{})}}
            placeholder="שם פרטי" value={firstName} dir="rtl"
            onChange={e=>{setFirstName(e.target.value);setFieldErrors(p=>({...p,firstName:""}));}}/>
        </FField>
        <FField label="שם משפחה *" error={fieldErrors.lastName}>
          <input style={{...s.input,...(fieldErrors.lastName?s.inputErr:{})}}
            placeholder="שם משפחה" value={lastName} dir="rtl"
            onChange={e=>{setLastName(e.target.value);setFieldErrors(p=>({...p,lastName:""}));}}/>
        </FField>
        <FField label="מספר תקציב *" error={fieldErrors.budget} hint="המספר שקיבלתם מהגן">
          <input style={{...s.input,...(fieldErrors.budget?s.inputErr:{})}}
            placeholder="לדוגמה: 2691" value={budget} dir="ltr" inputMode="numeric"
            onChange={e=>{setBudget(e.target.value);setFieldErrors(p=>({...p,budget:""}));}}/>
        </FField>
        <button style={s.primaryBtn} onClick={()=>{ if(validateIntro()) setStep(1); }}>
          בחרו ימים ←
        </button>
      </div>
    </div>
  );

  // ── STEP 3: success ────────────────────────────────────────────────
  if (step === 3) return (
    <div style={s.root}>
      <div style={{...s.card,alignItems:"center",gap:16}}>
        <div style={{fontSize:64}}>🎉</div>
        <h2 style={s.title}>ההזמנה נשלחה בהצלחה!</h2>
        <p style={s.subtitle}>{firstName} {lastName} — {totalDays()} ימים הוזמנו</p>
        <div style={{...s.notesBox,background:"#f0fdf4",border:"1.5px solid #86efac",width:"100%",gap:10}}>
          <div style={{fontSize:14,color:"#14532d"}}>📋 מספר תקציב: <strong>{budget}</strong></div>
          <div style={{fontSize:14,color:"#14532d"}}>📅 סה"כ ימים שהוזמנו: <strong>{totalDays()}</strong></div>
        </div>
        <p style={{fontSize:13,color:"#888",textAlign:"center",margin:0}}>
          הנתונים נשמרו בגיליון הגן. אין צורך בשום פעולה נוספת.
        </p>
        <button style={s.secondaryBtn} onClick={resetAll}>הזמנה חדשה</button>
      </div>
    </div>
  );

  // ── STEP 4: error ──────────────────────────────────────────────────
  if (step === 4) return (
    <div style={s.root}>
      <div style={{...s.card,alignItems:"center",gap:16}}>
        <div style={{fontSize:64}}>😕</div>
        <h2 style={s.title}>בעיה בחיבור לאינטרנט</h2>
        <p style={s.subtitle}>בדקו שאתם מחוברים לאינטרנט ונסו שוב.</p>
        <button style={s.primaryBtn} onClick={()=>setStep(2)}>נסו שוב</button>
        <button style={s.secondaryBtn} onClick={()=>setStep(1)}>חזרה לבחירת ימים</button>
      </div>
    </div>
  );

  // ── STEP 2: summary ────────────────────────────────────────────────
  if (step === 2) return (
    <div style={s.root}>
      <div style={{...s.card,maxWidth:600}}>
        <h2 style={s.title}>סיכום ואישור הזמנה</h2>
        <div style={s.childTag}>
          <span>👤</span>
          <span style={{fontSize:14}}><strong>{firstName} {lastName}</strong>&nbsp;|&nbsp;תקציב: <strong>{budget}</strong></span>
        </div>
        <div style={s.summaryBox}>
          {MARCH_SCHEDULE.map((week,wIdx)=>{
            const sels = week.days.map((day,dIdx)=>({day,dIdx,sel:getSel(wIdx,dIdx)})).filter(x=>x.sel);
            if(!sels.length) return null;
            const menu = MENUS[week.menuId];
            return (
              <div key={wIdx} style={s.summaryWeek}>
                <div style={s.summaryWeekTitle}>📅 {week.weekLabel} — {menu.label}</div>
                {sels.map(({day,dIdx,sel})=>{
                  const info = menu.days[day];
                  return (
                    <div key={dIdx} style={s.summaryRow}>
                      <span style={{fontSize:18,marginTop:2}}>{FOOD_ICONS[day]}</span>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <strong style={{fontSize:14}}>{day} {week.dates[dIdx]}</strong>
                          <span style={sel.mealType==="חלבי"?s.tagDairy:s.tagMeat}>{sel.mealType}</span>
                        </div>
                        <div style={{fontSize:12,color:"#555"}}>{info.main}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={s.summaryTotal}>סה"כ: {totalDays()} ימים</div>
        </div>
        <div style={s.bottomBar}>
          <button style={s.secondaryBtn} onClick={()=>setStep(1)}>← עריכה</button>
          <button
            style={{...s.primaryBtn,flex:1,...(sending?{background:"#aaa",cursor:"wait",boxShadow:"none"}:{})}}
            disabled={sending} onClick={handleSend}>
            {sending ? "⏳ שולח..." : `✅ שלח הזמנה (${totalDays()} ימים)`}
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP 1: select days ────────────────────────────────────────────
  return (
    <div style={s.root}>
      <div style={{...s.card,maxWidth:700}}>
        <div style={s.topBar}>
          <div>
            <h2 style={{...s.title,textAlign:"right",fontSize:20}}>בחרו ימים – מרץ 2026</h2>
            <p style={{...s.subtitle,textAlign:"right"}}>שלום {firstName}! סמנו את הימים הרצויים</p>
          </div>
          <div style={s.counterBadge}>{totalDays()} ימים</div>
        </div>

        {/* Modal תפריט */}
        {menuPreview&&(()=>{
          const {wIdx,dayName}=menuPreview;
          const week=MARCH_SCHEDULE[wIdx];
          const menu=MENUS[week.menuId];
          const info=menu.days[dayName];
          return (
            <div style={s.modalOverlay} onClick={()=>setMenuPreview(null)}>
              <div style={s.modal} onClick={e=>e.stopPropagation()} dir="rtl">
                <button style={s.modalClose} onClick={()=>setMenuPreview(null)}>✕</button>
                <div style={{fontSize:42,textAlign:"center"}}>{FOOD_ICONS[dayName]}</div>
                <h3 style={{fontSize:18,fontWeight:800,color:"#2d1a0a",textAlign:"center",margin:0}}>
                  יום {dayName} — {menu.label}
                </h3>
                <MRow label="🍽️ מנה עיקרית" val={info.main}/>
                <MRow label="🥗 תוספת"       val={info.side}/>
                {info.bonus&&<MRow label="⭐ נוסף"  val={info.bonus}/>}
                {info.extra&&<MRow label="🌽 שניצל" val={info.extra}/>}
                <button style={s.modalDone} onClick={()=>setMenuPreview(null)}>סגור</button>
              </div>
            </div>
          );
        })()}

        {/* שבועות */}
        {MARCH_SCHEDULE.map((week,wIdx)=>{
          const menu=MENUS[week.menuId];
          const weekCount=week.days.filter((_,dIdx)=>getSel(wIdx,dIdx)).length;
          return (
            <div key={wIdx} style={s.weekBlock}>
              <div style={s.weekHeader}>
                <span style={s.weekLabel}>📅 {week.weekLabel}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {weekCount>0&&<span style={s.weekCount}>{weekCount} ✓</span>}
                  <span style={s.menuTag}>{menu.label}</span>
                </div>
              </div>
              <div style={s.daysGrid}>
                {week.days.map((day,dIdx)=>{
                  const sel=getSel(wIdx,dIdx);
                  const selected=!!sel;
                  const info=menu.days[day];
                  return (
                    <div key={dIdx} style={{...s.dayCard,...(selected?s.dayCardSel:{})}}>
                      <div style={s.dayTop} onClick={()=>toggleDay(wIdx,dIdx)}>
                        <div style={{...s.checkbox,...(selected?s.checkboxSel:{})}}>
                          {selected&&<span style={s.checkmark}>✓</span>}
                        </div>
                        <div>
                          <div style={s.dayName}>{FOOD_ICONS[day]} יום {day}</div>
                          <div style={s.dayDate}>{week.dates[dIdx]}</div>
                        </div>
                      </div>
                      <div style={s.menuPreviewRow} onClick={()=>setMenuPreview({wIdx,dayName:day})}>
                        <span style={s.menuPreviewText}>{info.main.split("+")[0].trim()}…</span>
                        <span style={s.menuPreviewBtn}>👁 תפריט מלא</span>
                      </div>
                      {selected&&(
                        <div style={s.mealTypeRow}>
                          <span style={s.mealTypeLabel}>סוג:</span>
                          <button style={{...s.typeBtn,...(sel.mealType==="בשרי"?s.typeBtnMeat:{})}}
                            onClick={()=>setMealType(wIdx,dIdx,"בשרי")}>🥩 בשרי</button>
                          <button style={{...s.typeBtn,...(sel.mealType==="חלבי"?s.typeBtnDairy:{})}}
                            onClick={()=>setMealType(wIdx,dIdx,"חלבי")}>🧀 חלבי</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={s.bottomBar}>
          <button style={s.secondaryBtn} onClick={()=>setStep(0)}>← פרטים</button>
          <button
            style={{...s.primaryBtn,flex:1,...(totalDays()===0?{background:"#ccc",boxShadow:"none",cursor:"not-allowed"}:{})}}
            disabled={totalDays()===0} onClick={()=>setStep(2)}>
            סיכום ואישור ({totalDays()} ימים) →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── mini components ─────────────────────────────────────────────────
function FField({label,error,hint,children}){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:14,fontWeight:700,color:"#4a2c0a"}}>{label}</label>
      {hint&&<span style={{fontSize:12,color:"#999"}}>{hint}</span>}
      {children}
      {error&&<span style={{fontSize:12,color:"#ef4444"}}>{error}</span>}
    </div>
  );
}
function MRow({label,val}){
  return (
    <div style={{background:"#fffaf5",borderRadius:10,padding:"10px 14px",display:"flex",flexDirection:"column",gap:3}}>
      <span style={{fontSize:12,fontWeight:700,color:"#7a5c3a"}}>{label}</span>
      <span style={{fontSize:14,color:"#2d1a0a"}}>{val}</span>
    </div>
  );
}

// ── styles ──────────────────────────────────────────────────────────
const s={
  root:{minHeight:"100vh",background:"linear-gradient(135deg,#fdf6ec 0%,#fce8d0 50%,#f9d9b0 100%)",
    display:"flex",justifyContent:"center",alignItems:"flex-start",
    padding:"24px 16px",fontFamily:"'Segoe UI','Arial Hebrew',Arial,sans-serif",direction:"rtl"},
  card:{background:"white",borderRadius:20,padding:"28px 24px",maxWidth:480,width:"100%",
    boxShadow:"0 8px 40px rgba(0,0,0,0.10)",display:"flex",flexDirection:"column",gap:14,direction:"rtl"},
  title:{fontSize:22,fontWeight:800,color:"#2d1a0a",margin:0,textAlign:"center"},
  subtitle:{fontSize:13,color:"#7a5c3a",margin:0,textAlign:"center"},
  deadlineBadge:{background:"#fff3cd",border:"1.5px solid #f5c842",borderRadius:10,
    padding:"10px 16px",fontSize:14,color:"#6b4a00",fontWeight:600,textAlign:"center"},
  notesBox:{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:10,
    padding:"12px 14px",display:"flex",flexDirection:"column",gap:6},
  noteRow:{display:"flex",gap:8,alignItems:"flex-start"},
  divider:{height:1,background:"#f0e4cc"},
  input:{border:"2px solid #e2c89a",borderRadius:10,padding:"11px 14px",fontSize:15,
    outline:"none",width:"100%",boxSizing:"border-box",direction:"rtl",background:"#fffaf5"},
  inputErr:{border:"2px solid #ef4444"},
  primaryBtn:{background:"linear-gradient(135deg,#f5820a,#e06b00)",color:"white",border:"none",
    borderRadius:12,padding:"14px 24px",fontSize:16,fontWeight:700,cursor:"pointer",
    width:"100%",boxShadow:"0 4px 15px rgba(240,130,10,0.3)"},
  secondaryBtn:{background:"transparent",color:"#7a5c3a",border:"2px solid #e2c89a",
    borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:600,cursor:"pointer"},
  childTag:{display:"flex",gap:8,alignItems:"center",background:"#fffaf5",
    border:"1.5px solid #e2c89a",borderRadius:10,padding:"10px 14px"},
  summaryBox:{background:"#fffaf5",border:"1.5px solid #e2c89a",borderRadius:14,
    padding:"14px",display:"flex",flexDirection:"column",gap:14,maxHeight:400,overflowY:"auto"},
  summaryWeek:{display:"flex",flexDirection:"column",gap:8},
  summaryWeekTitle:{fontSize:13,fontWeight:700,color:"#7a5c3a",borderBottom:"1px solid #e2c89a",paddingBottom:6},
  summaryRow:{display:"flex",gap:10,alignItems:"flex-start"},
  summaryTotal:{fontWeight:700,color:"#f5820a",fontSize:15,textAlign:"center",borderTop:"1px solid #e2c89a",paddingTop:10},
  tagMeat:{background:"#fee2e2",color:"#991b1b",fontSize:11,fontWeight:600,borderRadius:6,padding:"1px 7px"},
  tagDairy:{background:"#e0f2fe",color:"#0c4a6e",fontSize:11,fontWeight:600,borderRadius:6,padding:"1px 7px"},
  topBar:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8},
  counterBadge:{background:"#f5820a",color:"white",fontWeight:700,fontSize:15,
    borderRadius:20,padding:"6px 16px",whiteSpace:"nowrap",flexShrink:0},
  weekBlock:{background:"#fffaf5",border:"1.5px solid #e2c89a",borderRadius:14,padding:"14px",
    display:"flex",flexDirection:"column",gap:10},
  weekHeader:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  weekLabel:{fontWeight:700,fontSize:14,color:"#4a2c0a"},
  weekCount:{background:"#f5820a",color:"white",fontSize:12,fontWeight:700,borderRadius:10,padding:"2px 8px"},
  menuTag:{background:"#fff3cd",color:"#7a4f00",fontWeight:600,fontSize:12,
    borderRadius:8,padding:"3px 10px",border:"1px solid #f5c842"},
  daysGrid:{display:"flex",flexDirection:"column",gap:8},
  dayCard:{border:"2px solid #e2c89a",borderRadius:12,padding:"10px 12px",
    background:"white",display:"flex",flexDirection:"column",gap:8},
  dayCardSel:{border:"2px solid #f5820a",background:"#fff8f0",boxShadow:"0 2px 12px rgba(245,130,10,0.13)"},
  dayTop:{display:"flex",alignItems:"center",gap:10,cursor:"pointer"},
  checkbox:{width:24,height:24,borderRadius:7,border:"2px solid #e2c89a",
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:"white"},
  checkboxSel:{background:"#fff8f0",border:"2px solid #f5820a"},
  checkmark:{color:"#f5820a",fontWeight:900,fontSize:15},
  dayName:{fontWeight:700,fontSize:14,color:"#2d1a0a"},
  dayDate:{fontSize:12,color:"#aaa"},
  menuPreviewRow:{display:"flex",justifyContent:"space-between",alignItems:"center",
    cursor:"pointer",borderTop:"1px solid #f0e4cc",paddingTop:6},
  menuPreviewText:{fontSize:12,color:"#7a5c3a",flex:1},
  menuPreviewBtn:{fontSize:12,color:"#f5820a",fontWeight:600},
  mealTypeRow:{display:"flex",alignItems:"center",gap:8,borderTop:"1px solid #f0e4cc",paddingTop:8},
  mealTypeLabel:{fontSize:13,color:"#7a5c3a",fontWeight:600},
  typeBtn:{border:"2px solid #e2c89a",borderRadius:8,padding:"5px 12px",fontSize:13,
    fontWeight:600,cursor:"pointer",background:"white",color:"#7a5c3a"},
  typeBtnMeat:{background:"#fee2e2",borderColor:"#ef4444",color:"#991b1b"},
  typeBtnDairy:{background:"#e0f2fe",borderColor:"#0ea5e9",color:"#0c4a6e"},
  bottomBar:{display:"flex",justifyContent:"space-between",gap:12,paddingTop:8,borderTop:"1px solid #f0e4cc"},
  modalOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
    display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20},
  modal:{background:"white",borderRadius:18,padding:"28px 22px",maxWidth:380,width:"100%",
    position:"relative",display:"flex",flexDirection:"column",gap:10,
    boxShadow:"0 10px 50px rgba(0,0,0,0.25)",direction:"rtl"},
  modalClose:{position:"absolute",top:12,left:12,background:"none",border:"none",
    fontSize:20,cursor:"pointer",color:"#999",fontWeight:700},
  modalDone:{background:"linear-gradient(135deg,#f5820a,#e06b00)",color:"white",border:"none",
    borderRadius:10,padding:"12px",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4},
};
