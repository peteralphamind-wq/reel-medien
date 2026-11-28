const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const OUT = process.argv[2];
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, f)).toString('base64');
const LOGO_D = b64('logo_dark.png'), LOGO_L = b64('logo_light.png'), PORTRAIT = b64('portrait.png');
const TAG = 'NERVENSYSTEM';
const N = 9;

const slides = [
  { kind: 'cover', kicker: 'Dein Körper im Alltag',
    h: 'Dein Körper ist schneller als dein Kopf.', it: 'Und das ist eigentlich gut so.' },
  { kicker: 'Du kennst das',
    h: 'Das Handy vibriert: «Hast du morgen kurz Zeit?»',
    p: 'Noch bevor du fertig gelesen hast, klopft das Herz, und der Bauch zieht sich zusammen. Dein Kopf hat noch gar nichts entschieden.' },
  { kicker: 'Was da passiert',
    h: 'Dein Wachhund hat gebellt.',
    p: 'Dein Nervensystem prüft die ganze Zeit, ob du sicher bist. Es fragt deinen Verstand nicht um Erlaubnis, es ist einfach schneller.' },
  { kind: 'quote',
    it: '«Reiss dich zusammen» hilft etwa so gut wie ein Vortrag für einen bellenden Hund.',
    p: 'Mit Argumenten erreichst du ihn nicht. Er braucht ein Zeichen, dass alles in Ordnung ist.' },
  { num: '1', kicker: 'Ausatmen',
    h: 'Atme länger aus als ein.',
    p: 'Etwa vier Sekunden ein und sechs bis acht Sekunden aus, ein paar Mal hintereinander. Das lange Ausatmen sagt deinem Körper: keine Gefahr.' },
  { num: '2', kicker: 'Ankommen',
    h: 'Spür deine Füsse am Boden.',
    p: 'Drück sie bewusst in den Boden und merk, wie der Stuhl dich trägt. So kommst du aus dem Kopfkino zurück in den Raum.' },
  { num: '3', kicker: 'Umschauen',
    h: 'Lass den Blick ruhig durch den Raum wandern.',
    p: 'Nenn dir drei Dinge, die du gerade siehst. Dein Wachhund merkt: Hier ist nichts, wovor ich dich schützen muss.' },
  { kind: 'gold', kicker: 'Der Punkt',
    h: 'Du bist nicht zu empfindlich.', it: 'Dein Wachhund ist nur sehr fleissig.',
    p: 'Und einen fleissigen Wachhund kannst du beruhigen, ohne ihn wegzuschicken.' },
  { kind: 'cta',
    h: 'Speicher dir das für den nächsten Puls-Moment.',
    p: 'Wenn du lernen willst, wie Kopf und Körper wieder zusammenarbeiten: 1:1 Coaching und WhatsApp-Community findest du im Profil.',
    btn: 'Links im Profil' },
];

const pulse = `<svg class="pulse" viewBox="0 0 1080 300" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#e3c27a" stop-opacity="0"/><stop offset=".35" stop-color="#e3c27a" stop-opacity=".9"/><stop offset=".7" stop-color="#e3c27a" stop-opacity=".9"/><stop offset="1" stop-color="#e3c27a" stop-opacity="0"/></linearGradient><filter id="f"><feGaussianBlur stdDeviation="6"/></filter></defs>
<path d="M0 170 H300 L340 170 L370 120 L400 170 L440 170 L470 40 L510 270 L550 110 L580 170 L640 170 L670 140 L700 170 H1080" fill="none" stroke="url(#g)" stroke-width="14" filter="url(#f)" opacity=".5"/>
<path d="M0 170 H300 L340 170 L370 120 L400 170 L440 170 L470 40 L510 270 L550 110 L580 170 L640 170 L670 140 L700 170 H1080" fill="none" stroke="url(#g)" stroke-width="5" stroke-linejoin="round"/></svg>`;

function dots(i, gold) {
  let s = '<div class="dots">';
  for (let k = 0; k < N; k++) s += `<span class="${k === i ? 'on' : ''}"></span>`;
  return s + '</div>';
}

function html(s, i) {
  const gold = s.kind === 'gold';
  const logo = gold ? LOGO_L : LOGO_D;
  let body = '';
  if (s.kind === 'cover') {
    body = `${pulse}<div class="content bottom"><div class="kicker">${s.kicker}</div><h1 class="big">${s.h} <em>${s.it}</em></h1></div>`;
  } else if (s.kind === 'quote') {
    body = `<div class="content"><div class="q">“</div><h2 class="it">${s.it}</h2><p>${s.p}</p></div>`;
  } else if (s.kind === 'cta') {
    body = `<div class="content"><img class="portrait" src="${PORTRAIT}"><div class="kicker">Peter Gsponer · NLP-Trainer und Mental Coach</div><h2>${s.h}</h2><p>${s.p}</p><div class="btn">${s.btn}</div></div>`;
  } else {
    body = `<div class="content">${s.num ? `<div class="num">${s.num}</div>` : ''}${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}<h2>${s.h}${s.it ? ` <em>${s.it}</em>` : ''}</h2>${s.p ? `<p>${s.p}</p>` : ''}</div>`;
  }
  const foot = s.kind === 'cover' ? '<div class="btn small">Wisch weiter</div>' : dots(i, gold);
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;800&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:Poppins,sans-serif;position:relative;
 background:${gold ? 'linear-gradient(160deg,#ecd08e,#dcb769)' :
   'radial-gradient(ellipse 70% 45% at 85% 0%,rgba(227,194,122,.22),transparent 70%),radial-gradient(ellipse 60% 40% at 0% 100%,rgba(190,140,50,.20),transparent 70%),radial-gradient(ellipse at 50% 40%,#13203f,#080c1c 75%)'};
 color:${gold ? '#141c33' : '#f4efe6'}}
body:before{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 110% 110%,transparent 0 38px,${gold ? 'rgba(20,28,51,.05)' : 'rgba(227,194,122,.045)'} 39px 40px);pointer-events:none}
.frame{position:absolute;inset:35px;border:1.5px solid ${gold ? 'rgba(20,28,51,.18)' : 'rgba(255,255,255,.14)'};border-radius:26px}
.logo{position:absolute;left:86px;top:70px;width:110px;mix-blend-mode:${gold ? 'normal' : 'lighten'}}
.tag{position:absolute;right:92px;top:100px;font-weight:600;letter-spacing:.2em;font-size:25px;color:${gold ? '#141c33' : '#e3c27a'}}
.content{position:absolute;left:97px;right:110px;top:50%;transform:translateY(-50%)}
.content.bottom{top:auto;bottom:200px;transform:none}
.kicker{font-weight:600;letter-spacing:.2em;text-transform:uppercase;font-size:25px;line-height:1.7;color:${gold ? '#141c33' : '#e3c27a'};margin-bottom:22px}
h1,h2{font-weight:800;letter-spacing:-.02em;line-height:1.12}
h1.big{font-size:82px}
h2{font-size:66px}
em{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;letter-spacing:0;color:${gold ? '#141c33' : '#e3c27a'};font-size:1.08em;line-height:1.05}
h2.it{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;letter-spacing:0;font-size:76px;line-height:1.12}
p{font-size:38px;line-height:1.55;margin-top:34px;opacity:.92}
.num{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:150px;line-height:1;color:#e3c27a;margin-bottom:10px}
.q{font-family:'Cormorant Garamond',serif;font-size:190px;line-height:.6;color:#e3c27a;height:90px}
.handle{position:absolute;left:97px;bottom:98px;font-weight:600;font-size:28px;opacity:.7}
.dots{position:absolute;right:96px;bottom:106px;display:flex;gap:10px}
.dots span{width:34px;height:5px;border-radius:3px;background:${gold ? 'rgba(20,28,51,.25)' : 'rgba(227,194,122,.35)'}}
.dots span.on{width:60px;background:${gold ? '#141c33' : '#e3c27a'}}
.btn{display:inline-block;background:#e3c27a;color:#141c33;font-weight:800;font-size:38px;padding:26px 46px;border-radius:16px;margin-top:46px}
.btn.small{position:absolute;right:96px;bottom:82px;font-size:28px;padding:16px 36px;border-radius:40px;margin:0}
.portrait{width:224px;height:224px;border-radius:50%;border:5px solid #e3c27a;margin-bottom:34px;display:block}
.pulse{position:absolute;left:0;top:270px;width:1080px;height:300px}
</style></head><body><div class="frame"></div><img class="logo" src="${logo}"><div class="tag">${TAG}</div>${body}<div class="handle">@petergsponer</div>${foot}</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  fs.mkdirSync(OUT, { recursive: true });
  for (let i = 0; i < slides.length; i++) {
    await page.setContent(html(slides[i], i), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const nn = String(i + 1).padStart(2, '0');
    await page.screenshot({ path: path.join(OUT, `folie-${nn}.jpg`), type: 'jpeg', quality: 92 });
  }
  await browser.close();
})();
