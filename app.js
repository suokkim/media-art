// rgbk — media art. 데이터: data/works.json (글, 손으로 고침) + data/media.json (미디어 목록, 스크립트가 만듦)
// 주소: #/ = 목록(노션과 같은 분류·순서), #/<slug> = 작품. 언어: ?lang=en 또는 KO/EN 버튼
const SITE = "https://suokkim.github.io/media-art/";
const CATS = ["unreal", "tiktok", "realtime", "drawing"];
// 분류 버튼은 이모지만 — 이름은 아래 묶음 제목에 (디렉터 10-03 "카테고리를 간단하게")
const EMOJI = { all: "✳️", unreal: "🎥", tiktok: "🃏", realtime: "📺", drawing: "✏️" };

const T = {
  ko: {
    sub: "미디어아트", share: "공유", sms: "문자로 보내기", qr: "QR 크게 보기", close: "닫기",
    tapclose: "아무 데나 누르면 닫힙니다", back: "← 목록", prev: "← 이전", next: "다음 →",
    tech: "게임 엔진을 활용한 실시간 재생 비디오", smsBody: "rgbk 미디어아트", lang: "EN",
    all: "전체", unreal: "도큐멘터리", tiktok: "블랙코미디", realtime: "미디어아트", drawing: "드로잉북",
  },
  en: {
    sub: "Media art", share: "Share", sms: "Send by text message", qr: "Show QR code", close: "Close",
    tapclose: "Tap anywhere to close", back: "← All works", prev: "← Previous", next: "Next →",
    tech: "Real-time playback video using a game engine", smsBody: "rgbk — media art", lang: "KO",
    all: "All", unreal: "Documentary", tiktok: "Black comedy", realtime: "Media art", drawing: "Drawing book",
  },
};

let lang = pickLang();
let works = [], media = {};
let cat = "all";   // 분류: all | unreal(도큐멘터리) | tiktok(블랙코미디) | realtime(미디어아트) — 포트폴리오와 같은 방식 (디렉터 10-03)

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

// split 작품(minecraft…)은 목록에서 영상 하나하나를 카드로 꺼내 보인다 (디렉터 10-03)
function cards(w) {
  if (!w.split) return card(w);
  return (media[w.slug] || []).map((m, k) => `<a class="card" href="#/${w.slug}/${k + 1}">
    <div class="thumb"><img src="${m.poster || m.src}" alt="${esc(m.caption || "")}" loading="lazy"></div>
    <h2>${esc(m.caption || String(k + 1))}</h2>
    <div class="meta">${esc(L(w.title))}</div>
  </a>`).join("");
}

function listView() {
  document.title = "rgbk — media art";
  return CATS.filter((c) => cat === "all" || cat === c).map((c) => {
    const ws = works.filter((w) => w.cat === c);
    return ws.length ? `<section class="group"><h3>${t(c)}</h3><div class="grid">${ws.map(cards).join("")}</div></section>` : "";
  }).join("");
}

function workView(w) {
  document.title = `${L(w.title)} — rgbk`;
  const i = works.indexOf(w);
  const prev = works[i - 1], next = works[i + 1];
  // 영상이 먼저 보이게 — 첫 영상은 소리 없이 자동 반복, 나머지는 눌러야 받는다
  let firstVideo = true;
  const fig = (m) => {
    let el;
    if (m.type === "video") {
      el = firstVideo
        ? `<video src="${m.src}" poster="${m.poster}" controls playsinline muted autoplay loop preload="metadata"></video>`
        : `<video src="${m.src}" poster="${m.poster}" controls playsinline preload="none"></video>`;
      firstVideo = false;
    } else {
      el = `<img src="${m.src}" alt="${esc(L(w.title))}" loading="lazy">`;
    }
    return `<figure>${el}${m.caption && !w.tiles ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
  };
  const all = media[w.slug] || [];
  // groups: 노션 하위 데이터베이스별 묶음 제목 (Digital Painting) — 포트폴리오와 같음
  const items = w.groups
    ? w.groups.map((g) => `<h2 class="group-title">${esc(L(g))}</h2><div class="media${w.tiles ? " tiles" : ""}">` +
        all.filter((m) => m.group === g.key).map(fig).join("") + "</div>").join("")
    : `<div class="media${w.tiles ? " tiles" : ""}">${all.map(fig).join("")}</div>`;
  // split: 영상마다 따로 페이지 — 작품 페이지는 영상 목록만 (디렉터 10-03, minecraft…)
  const body = w.split
    ? `<div class="grid">${(media[w.slug] || []).map((m, k) => `<a class="card" href="#/${w.slug}/${k + 1}">
        <div class="thumb"><img src="${m.poster || m.src}" alt="${esc(m.caption || "")}" loading="lazy"></div>
        <h2>${esc(m.caption || String(k + 1))}</h2></a>`).join("")}</div>`
    : items;
  return `<article class="work">
    <a class="back" href="#/">${t("back")}</a>
    <h1>${esc(L(w.title))}</h1>
    <div class="meta" style="color:var(--muted);font-size:.85rem;margin:-8px 0 16px">${[w.year, t(w.cat)].filter(Boolean).join(" · ")}${w.tech ? " · " + t("tech") : ""}</div>
    <p class="statement">${esc(L(w.text))}</p>
    <div class="work-share"><button class="share-btn" type="button" aria-label="QR"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg></button></div>
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
    <a class="back" href="#/">${t("back")}</a>
    <h1>${esc(name)}</h1>
    <div class="work-share"><button class="share-btn" type="button" aria-label="QR"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg></button></div>
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
  const filter = document.getElementById("filter");
  filter.innerHTML = ["all", ...CATS].map((c) =>
    `<button type="button" data-cat="${c}" aria-pressed="${c === cat}" title="${t(c)}" aria-label="${t(c)}">${EMOJI[c]}</button>`).join("");
  filter.querySelectorAll("button").forEach((b) => (b.onclick = () => { cat = b.dataset.cat; w ? (location.hash = "#/") : render(); }));
  document.getElementById("view").innerHTML = w && n ? clipView(w, +n) : w ? workView(w) : listView();
  watchCenter();
  document.querySelectorAll("#view .share-btn").forEach((b) => (b.onclick = openQR));
  // 이미지 누르면 크게 — 같은 페이지 이미지끼리 위아래로 넘김 (드로잉북 때문에, 포트폴리오와 같음)
  document.querySelectorAll("#view .media img").forEach((img, k, list) => (img.onclick = () => openZoom([...list], k)));
}

function openZoom(imgs, k) {
  const z = document.getElementById("zoom");
  z.innerHTML = `<button class="zoom-close" type="button">${t("close")}</button>` +
    imgs.map((i) => `<div class="z"><img src="${i.src}" alt="" loading="lazy"></div>`).join("");
  z.hidden = false;
  document.body.style.overflow = "hidden";
  z.querySelectorAll(".z")[k].scrollIntoView();
  z.querySelector(".zoom-close").onclick = closeZoom;
}
function closeZoom() {
  document.getElementById("zoom").hidden = true;
  document.body.style.overflow = "";
}

// 휴대폰(마우스 호버 없음): 화면 세로 가운데에 가장 가까운 썸네일 한 줄만 제목이 올라온다 — 포트폴리오와 같음
function watchCenter() {
  if (matchMedia("(hover: hover)").matches) return;
  const mid = innerHeight / 2;
  let best = null, d = Infinity;
  document.querySelectorAll("#view .card").forEach((c) => {
    const r = c.getBoundingClientRect(), dc = Math.abs(r.top + r.height / 2 - mid);
    if (dc < d) { d = dc; best = r.top; }
  });
  document.querySelectorAll("#view .card").forEach((c) => c.classList.toggle("on", c.getBoundingClientRect().top === best));
}
addEventListener("scroll", watchCenter, { passive: true });
addEventListener("resize", watchCenter);

// QR — 공유 버튼 대신 QR 아이콘, 누르면 바로 QR 만 화면 가득 (디렉터 10-03)
// 화면 밝기는 웹에서 바꿀 수 없다(브라우저에 그런 기능이 없음) — 대신 흰 화면 + 켜져 있는 동안 화면이 어두워지거나 꺼지지 않게
let wake = null;
async function openQR() {
  document.getElementById("qr-full").hidden = false;
  try { wake = await navigator.wakeLock?.request("screen"); } catch (e) {}
}
function closeQR() {
  document.getElementById("qr-full").hidden = true;
  if (wake) { wake.release().catch(() => {}); wake = null; }
}

document.querySelectorAll("header .share-btn, footer .share-btn").forEach((b) => (b.onclick = openQR));
document.getElementById("qr-full").onclick = closeQR;
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeQR(); closeZoom(); }
});
document.getElementById("lang").onclick = () => setLang(lang === "ko" ? "en" : "ko");
window.addEventListener("hashchange", () => { closeZoom(); render(); window.scrollTo(0, 0); });

Promise.all([fetch("data/works.json").then((r) => r.json()), fetch("data/media.json").then((r) => r.json())])
  .then(([w, m]) => { works = w; media = m; render(); });
