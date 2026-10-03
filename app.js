// rgbk — media art. 데이터: data/works.json (글, 손으로 고침) + data/media.json (미디어 목록, 스크립트가 만듦)
// 주소: #/ = 목록(노션과 같은 분류·순서), #/<slug> = 작품. 언어: ?lang=en 또는 KO/EN 버튼
const SITE = "https://suokkim.github.io/media-art/";
const CATS = ["unreal", "tiktok", "realtime"];

const T = {
  ko: {
    sub: "미디어아트", share: "공유", sms: "문자로 보내기", qr: "QR 크게 보기", close: "닫기",
    tapclose: "아무 데나 누르면 닫힙니다", back: "← 목록", prev: "← 이전", next: "다음 →",
    tech: "게임 엔진을 활용한 실시간 재생 비디오", smsBody: "rgbk 미디어아트", lang: "EN",
  },
  en: {
    sub: "Media art", share: "Share", sms: "Send by text message", qr: "Show QR code", close: "Close",
    tapclose: "Tap anywhere to close", back: "← All works", prev: "← Previous", next: "Next →",
    tech: "Real-time playback video using a game engine", smsBody: "rgbk — media art", lang: "KO",
  },
};

let lang = pickLang();
let works = [], media = {};

function pickLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "ko" || q === "en") return q;
  try { const s = localStorage.getItem("lang"); if (s === "ko" || s === "en") return s; } catch (e) {}
  return (navigator.language || "ko").startsWith("ko") ? "ko" : "en";
}
function setLang(l) {
  lang = l;
  try { localStorage.setItem("lang", l); } catch (e) {}
  render();
}
const t = (k) => T[lang][k];
const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang] || o.ko);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 대표 이미지: works.json 의 cover 번호 → 없으면 첫 이미지 → 없으면 첫 영상 포스터
function coverOf(w) {
  const items = media[w.slug] || [];
  const pick = w.cover ? items[w.cover - 1] : items.find((i) => i.type === "image") || items[0];
  if (!pick) return "";
  return pick.type === "video" ? pick.poster : pick.src;
}

function card(w) {
  return `<a class="card" href="#/${w.slug}">
    <div class="thumb"><img src="${coverOf(w)}" alt="${esc(L(w.title))}" loading="lazy"></div>
    <h2>${esc(L(w.title))}</h2>
    <div class="meta">${w.year || ""}</div>
  </a>`;
}

function listView() {
  document.title = "rgbk — media art";
  return CATS.map((c) => {
    const ws = works.filter((w) => w.cat === c);
    return ws.length ? `<section class="group"><h3>${c}</h3><div class="grid">${ws.map(card).join("")}</div></section>` : "";
  }).join("");
}

function workView(w) {
  document.title = `${L(w.title)} — rgbk`;
  const i = works.indexOf(w);
  const prev = works[i - 1], next = works[i + 1];
  // 영상이 먼저 보이게 — 첫 영상은 소리 없이 자동 반복, 나머지는 눌러야 받는다
  let firstVideo = true;
  const items = (media[w.slug] || []).map((m) => {
    let el;
    if (m.type === "video") {
      el = firstVideo
        ? `<video src="${m.src}" poster="${m.poster}" controls playsinline muted autoplay loop preload="metadata"></video>`
        : `<video src="${m.src}" poster="${m.poster}" controls playsinline preload="none"></video>`;
      firstVideo = false;
    } else {
      el = `<img src="${m.src}" alt="${esc(L(w.title))}" loading="lazy">`;
    }
    return `<figure>${el}${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
  }).join("");
  // split: 영상마다 따로 페이지 — 작품 페이지는 영상 목록만 (디렉터 10-03, minecraft…)
  const body = w.split
    ? `<div class="grid">${(media[w.slug] || []).map((m, k) => `<a class="card" href="#/${w.slug}/${k + 1}">
        <div class="thumb"><img src="${m.poster || m.src}" alt="${esc(m.caption || "")}" loading="lazy"></div>
        <h2>${esc(m.caption || String(k + 1))}</h2></a>`).join("")}</div>`
    : `<div class="media">${items}</div>`;
  return `<article class="work">
    <a class="back" href="#/">${t("back")}</a>
    <h1>${esc(L(w.title))}</h1>
    <div class="meta" style="color:var(--muted);font-size:.85rem;margin:-8px 0 16px">${[w.year, w.cat].filter(Boolean).join(" · ")}${w.tech ? " · " + t("tech") : ""}</div>
    <p class="statement">${esc(L(w.text))}</p>
    <div class="work-share"><button class="share-btn" type="button">${t("share")}</button></div>
    ${body}
    <nav class="next">
      <span>${prev ? `<a href="#/${prev.slug}">${t("prev")}</a>` : ""}</span>
      <span>${next ? `<a href="#/${next.slug}">${t("next")}</a>` : ""}</span>
    </nav>
  </article>`;
}

// #/<slug>/<번호> — 영상 하나짜리 페이지
function clipView(w, n) {
  const all = media[w.slug] || [], m = all[n - 1];
  if (!m) return workView(w);
  const name = m.caption || String(n);
  document.title = `${name} — ${L(w.title)} — rgbk`;
  return `<article class="work">
    <a class="back" href="#/${w.slug}">← ${esc(L(w.title))}</a>
    <h1>${esc(name)}</h1>
    <div class="work-share"><button class="share-btn" type="button">${t("share")}</button></div>
    <div class="media"><figure><video src="${m.src}" poster="${m.poster}" controls playsinline muted autoplay loop preload="metadata"></video></figure></div>
    <nav class="next">
      <span>${n > 1 ? `<a href="#/${w.slug}/${n - 1}">${t("prev")}</a>` : ""}</span>
      <span>${n < all.length ? `<a href="#/${w.slug}/${n + 1}">${t("next")}</a>` : ""}</span>
    </nav>
  </article>`;
}

function render() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
  document.getElementById("lang").textContent = t("lang");
  const [slug, n] = location.hash.replace(/^#\/?/, "").split("/");
  const w = works.find((x) => x.slug === slug);
  document.getElementById("view").innerHTML = w && n ? clipView(w, +n) : w ? workView(w) : listView();
  document.querySelectorAll("#view .share-btn").forEach((b) => (b.onclick = openSheet));
}

// 공유 — 문자: 지금 보고 있는 페이지 주소 / QR: 사이트 첫 화면 주소
function openSheet() {
  const url = SITE + (location.hash.length > 2 ? location.hash : "");
  const w = works.find((x) => x.slug === location.hash.replace(/^#\/?/, "").split("/")[0]);
  const body = `${w ? L(w.title) + " — " : ""}${t("smsBody")} ${url}`;
  // iOS 는 sms:&body=, 안드로이드는 sms:?body= — 둘 다 받는 꼴
  document.getElementById("sms").href = "sms:?&body=" + encodeURIComponent(body);
  document.getElementById("sheet").hidden = false;
}
function closeSheet() { document.getElementById("sheet").hidden = true; }

document.querySelectorAll("header .share-btn, footer .share-btn").forEach((b) => (b.onclick = openSheet));
document.getElementById("sheet-close").onclick = closeSheet;
document.getElementById("sheet").onclick = (e) => { if (e.target.id === "sheet") closeSheet(); };
document.getElementById("qr-open").onclick = () => { closeSheet(); document.getElementById("qr-full").hidden = false; };
document.getElementById("qr-full").onclick = () => (document.getElementById("qr-full").hidden = true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeSheet(); document.getElementById("qr-full").hidden = true; }
});
document.getElementById("lang").onclick = () => setLang(lang === "ko" ? "en" : "ko");
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

Promise.all([fetch("data/works.json").then((r) => r.json()), fetch("data/media.json").then((r) => r.json())])
  .then(([w, m]) => { works = w; media = m; render(); });
