document.addEventListener("DOMContentLoaded", () => {
console.log("JS LOADED ✅");

/* ═══════════════════════════════════════════════
   TOAST NOTIFICATION  (replaces every alert())
═══════════════════════════════════════════════ */
function showToast(message, type = "info") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position:fixed; top:20px; right:20px; z-index:99999;
            display:flex; flex-direction:column; gap:10px; pointer-events:none;
        `;
        document.body.appendChild(container);
    }
    const colors = { success:'#22c55e', error:'#ef4444', info:'#3b82f6', warning:'#f59e0b' };
    const icons  = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    const toast  = document.createElement('div');
    toast.style.cssText = `
        background:${colors[type]||colors.info}; color:#fff;
        padding:12px 18px; border-radius:10px; font-size:14px; font-weight:500;
        box-shadow:0 6px 20px rgba(0,0,0,.25);
        opacity:0; transform:translateX(60px);
        transition:all .35s cubic-bezier(.34,1.56,.64,1);
        max-width:340px; pointer-events:auto;
        display:flex; align-items:center; gap:8px;
    `;
    toast.innerHTML = `<span>${icons[type]||''}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity='1'; toast.style.transform='translateX(0)'; });
    setTimeout(() => {
        toast.style.opacity='0'; toast.style.transform='translateX(60px)';
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

/* ═══════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════ */
const htmlEl = document.documentElement;

function updateIcon(isDark) {
    document.querySelectorAll('#theme-icon, #theme-icon-admin').forEach(icon => {
        icon.classList.toggle('bx-sun',  isDark);
        icon.classList.toggle('bx-moon', !isDark);
    });
}
function initTheme() {
    const savedTheme = localStorage.getItem('teclipse-theme');
    const isDark = savedTheme === 'dark';
    htmlEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
    updateIcon(isDark);
}
document.querySelectorAll('#theme-toggle, #theme-toggle-admin').forEach(btn => {
    btn.addEventListener('click', () => {
        const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('teclipse-theme', newTheme);
        updateIcon(newTheme === 'dark');
    });
});
initTheme();

/* ═══════════════════════════════════════════════
   NAVBAR SCROLL
═══════════════════════════════════════════════ */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
});

/* ═══════════════════════════════════════════════
   MOBILE MENU  — FIX: hamburger now works
═══════════════════════════════════════════════ */
const hamburger   = document.querySelector('.hamburger, .menu-toggle, #menu-toggle, [data-menu-toggle]');
const mobileMenu  = document.querySelector('.mobile-menu, .nav-mobile, #mobile-menu, #nav-mobile');
const mobileClose = document.querySelector('.mobile-close, #mobile-close, [data-mobile-close]');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.toggle('open');
        mobileMenu.classList.toggle('active');
    });
}
if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', () => {
        mobileMenu.classList.remove('open', 'active');
    });
}
// Close mobile menu when any nav link inside it is clicked
document.querySelectorAll('.mobile-menu a, #mobile-menu a, .nav-mobile a').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu) mobileMenu.classList.remove('open', 'active');
    });
});

/* ═══════════════════════════════════════════════
   ADMIN LOGIN MODAL
   FIX: both desktop btn + mobile menu btn now work
═══════════════════════════════════════════════ */
const modal     = document.getElementById("login-modal");
const closeModal = document.getElementById("close-modal");

// Grab ALL elements that should open the modal (desktop + mobile)
function openModal() { if (modal) modal.style.display = "flex"; }
function closeLoginModal() { if (modal) modal.style.display = "none"; }

// Desktop button
const loginBtn = document.getElementById("login-btn");
if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });

// Mobile menu button — try multiple possible IDs/classes
['mobile-login-btn', 'mobile-admin-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
});
// Also catch any <a> or <button> inside the mobile menu that says "Admin Login"
document.querySelectorAll('.mobile-menu a, #mobile-menu a, .nav-mobile a, .mobile-nav a').forEach(el => {
    if (el.textContent.trim().toLowerCase().includes('admin')) {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            if (mobileMenu) mobileMenu.classList.remove('open', 'active');
            openModal();
        });
    }
});

if (closeModal) closeModal.addEventListener('click', closeLoginModal);
window.addEventListener('click', (e) => { if (e.target === modal) closeLoginModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLoginModal(); });

/* ═══════════════════════════════════════════════
   ADMIN LOGIN FORM
   Calls: POST /api/adminlogin  (api/adminlogin.js on Vercel)
═══════════════════════════════════════════════ */
const adminForm = document.getElementById('admin-login-form');
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email     = document.getElementById('admin-email').value.trim();
        const password  = document.getElementById('admin-pass').value;
        const submitBtn = adminForm.querySelector('button[type="submit"]');

        if (!email || !password) { showToast("Please fill in all fields", "warning"); return; }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Logging in…"; }

        try {
            // FIX: use absolute Vercel URL so it works when frontend is on Hostinger
            const VERCEL_API = "https://teclipse-weld.vercel.app";
            const res  = await fetch(`${VERCEL_API}/api/adminlogin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            let data;
            try { data = await res.json(); } catch { throw new Error("Bad server response"); }

            if (res.ok && data.success) {
                localStorage.setItem('teclipse_admin_auth', 'true');
                showToast("Login successful! Redirecting…", "success");
                setTimeout(() => { window.location.href = 'admin.html'; }, 1000);
            } else {
                showToast(data.message || "Invalid credentials", "error");
            }
        } catch (err) {
            console.error("Admin login error:", err);
            showToast("Server error. Please try again.", "error");
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Secure Login"; }
        }
    });
}

/* ═══════════════════════════════════════════════
   STAR RATING
═══════════════════════════════════════════════ */
const stars       = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');
stars.forEach(star => {
    star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        if (ratingInput) ratingInput.value = value;
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= value));
    });
});

/* ═══════════════════════════════════════════════
   FEEDBACK FORM
   Calls: POST /api/sendemail (api/sendemail.js on Vercel)
═══════════════════════════════════════════════ */
const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!ratingInput?.value) { showToast("Please select a star rating ⭐", "warning"); return; }

        const name    = document.getElementById('name').value.trim();
        const email   = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const rating  = parseInt(ratingInput.value);

        if (!name || !email || !message) { showToast("Please fill in all fields", "warning"); return; }

        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

        try {
            // 1. Save to Firestore
            if (window.firebaseDb && window.firebaseModules) {
                const { collection, addDoc } = window.firebaseModules;
                await addDoc(collection(window.firebaseDb, "feedbacks"), {
                    name, email, message, rating, timestamp: Date.now()
                });
            }
            // 2. Send email via Vercel API
            const VERCEL_API = "https://teclipse-weld.vercel.app";
            await fetch(`${VERCEL_API}/api/sendemail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message, rating })
            });

            showToast("Feedback submitted! Thank you 🎉", "success");
            feedbackForm.reset();
            if (ratingInput) ratingInput.value = '';
            stars.forEach(s => s.classList.remove('active'));
        } catch (err) {
            console.error("Feedback error:", err);
            showToast("Error submitting feedback. Try again.", "error");
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Submit Feedback"; }
        }
    });
}

/* ═══════════════════════════════════════════════
   FIREBASE READY HELPER
   Polls until window.firebaseDb is available
═══════════════════════════════════════════════ */
function waitForFirebase(callback, maxMs = 10000) {
    const start = Date.now();
    function check() {
        if (window.firebaseDb && window.firebaseModules) { callback(); return; }
        if (Date.now() - start > maxMs) { console.warn("Firebase timeout"); callback(); return; }
        setTimeout(check, 400);
    }
    check();
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS
   FIX: center-aligned text, card properly placed
   between arrows, auto-slide every 4s
═══════════════════════════════════════════════ */
let currentSlide   = 0;
let sliderInterval = null;

// Inject the testimonial wrapper styles once
(function injectTestimonialStyles() {
    if (document.getElementById('tec-testimonial-styles')) return;
    const style = document.createElement('style');
    style.id = 'tec-testimonial-styles';
    style.textContent = `
        /* ── Testimonial slider layout ── */
        .testimonial-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            width: 100%;
            max-width: 780px;
            margin: 0 auto;
            position: relative;
        }
        #testimonial-slider {
            flex: 1;
            min-height: 160px;
            position: relative;
            overflow: hidden;
        }
        .testimonial-slide {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 28px 32px;
            background: var(--bg-secondary, #f8f9fa);
            border-radius: 16px;
            border: 1px solid var(--border-color, #e5e7eb);
            animation: fadeSlide .45s ease;
        }
        .testimonial-slide.active { display: flex; }
        .testimonial-slide p {
            font-size: 1rem;
            line-height: 1.7;
            color: var(--text-primary, #111);
            margin: 0 0 14px;
            font-style: italic;
        }
        .testimonial-slide h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--primary-color, #2563eb);
            margin: 0 0 8px;
        }
        .testimonial-slide .slide-stars { font-size: 16px; letter-spacing: 2px; }
        @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Arrow buttons ── */
        .slide-arrow {
            background: var(--primary-color, #2563eb);
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 40px; height: 40px;
            font-size: 18px;
            cursor: pointer;
            flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            transition: background .2s, transform .2s;
            box-shadow: 0 3px 10px rgba(0,0,0,.15);
        }
        .slide-arrow:hover { background: var(--primary-dark, #1d4ed8); transform: scale(1.1); }

        @media (max-width: 600px) {
            .testimonial-wrapper { gap: 8px; }
            .testimonial-slide { padding: 20px 16px; }
            .slide-arrow { width: 34px; height: 34px; font-size: 15px; }
        }
    `;
    document.head.appendChild(style);
})();

function startAutoSlide() {
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        const slides = document.querySelectorAll('.testimonial-slide');
        if (slides.length < 2) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

function goSlide(dir) {
    const slides = document.querySelectorAll('.testimonial-slide');
    if (!slides.length) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    startAutoSlide(); // restart timer on manual click
}

// Wrap the slider + arrows inside .testimonial-wrapper if not already done
function ensureSliderWrapper() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;
    if (slider.parentElement.classList.contains('testimonial-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'testimonial-wrapper';

    const btnPrev = document.createElement('button');
    btnPrev.className = 'slide-arrow';
    btnPrev.id = 'prev-btn';
    btnPrev.innerHTML = '&#8249;';
    btnPrev.setAttribute('aria-label', 'Previous');

    const btnNext = document.createElement('button');
    btnNext.className = 'slide-arrow';
    btnNext.id = 'next-btn';
    btnNext.innerHTML = '&#8250;';
    btnNext.setAttribute('aria-label', 'Next');

    slider.parentNode.insertBefore(wrapper, slider);
    wrapper.appendChild(btnPrev);
    wrapper.appendChild(slider);
    wrapper.appendChild(btnNext);

    btnPrev.addEventListener('click', () => goSlide(-1));
    btnNext.addEventListener('click', () => goSlide(1));
}

// Also wire existing prev/next buttons (if already in HTML)
const existingNext = document.getElementById("next-btn");
const existingPrev = document.getElementById("prev-btn");
if (existingNext) existingNext.addEventListener('click', () => goSlide(1));
if (existingPrev) existingPrev.addEventListener('click', () => goSlide(-1));

function loadTestimonials() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;

    ensureSliderWrapper();
    slider.innerHTML = `
        <div class="testimonial-slide active" style="opacity:.5;">
            <p>Loading testimonials…</p>
        </div>`;

    waitForFirebase(() => {
        if (!window.firebaseDb) {
            slider.innerHTML = `<div class="testimonial-slide active"><p>"Could not connect to database."</p></div>`;
            return;
        }
        const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));

        onSnapshot(q, (snapshot) => {
            slider.innerHTML = "";
            currentSlide = 0;
            if (sliderInterval) clearInterval(sliderInterval);

            if (snapshot.empty) {
                slider.innerHTML = `
                    <div class="testimonial-slide active">
                        <p>"Be the first to share your experience!"</p>
                        <h4>— Teclipse Team</h4>
                    </div>`;
                return;
            }

            let idx = 0;
            snapshot.forEach(doc => {
                const d = doc.data();
                const div = document.createElement('div');
                div.className = 'testimonial-slide' + (idx === 0 ? ' active' : '');
                div.innerHTML = `
                    <p>"${d.message || ''}"</p>
                    <h4>— ${d.name || 'Anonymous'}</h4>
                    ${d.rating ? `<div class="slide-stars">${'⭐'.repeat(Math.min(parseInt(d.rating),5))}</div>` : ''}
                `;
                slider.appendChild(div);
                idx++;
            });

            if (idx > 1) startAutoSlide();
        }, (err) => {
            console.error("Testimonials error:", err);
            slider.innerHTML = `<div class="testimonial-slide active"><p>"Could not load testimonials."</p></div>`;
        });
    });
}

loadTestimonials();

/* ═══════════════════════════════════════════════
   ACHIEVEMENTS
   FIX: right-to-left auto-slide + manual buttons
        + zoom lightbox on click
═══════════════════════════════════════════════ */
(function injectAchievementStyles() {
    if (document.getElementById('tec-achievement-styles')) return;
    const style = document.createElement('style');
    style.id = 'tec-achievement-styles';
    style.textContent = `
        /* ── Achievements slider ── */
        .ach-slider-wrap {
            position: relative;
            width: 100%;
            overflow: hidden;
        }
        .ach-track {
            display: flex;
            gap: 20px;
            transition: transform .5s cubic-bezier(.4,0,.2,1);
            will-change: transform;
        }
        .achievement-card {
            flex: 0 0 calc(33.333% - 14px);
            min-width: 220px;
            background: var(--bg-secondary, #f8f9fa);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            transition: box-shadow .25s;
        }
        .achievement-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.12); }
        .achievement-card img {
            width: 100%; height: 180px;
            object-fit: cover;
            display: block;
            transition: transform .35s ease;
        }
        .achievement-card:hover img { transform: scale(1.04); }
        .achievement-card p {
            padding: 10px 14px;
            font-size: .9rem;
            font-weight: 500;
            text-align: center;
            margin: 0;
        }

        /* ── Ach controls row ── */
        .ach-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-top: 18px;
        }
        .ach-arrow {
            background: var(--primary-color, #2563eb);
            color: #fff;
            border: none; border-radius: 50%;
            width: 38px; height: 38px;
            font-size: 18px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: background .2s, transform .2s;
            box-shadow: 0 3px 10px rgba(0,0,0,.15);
        }
        .ach-arrow:hover { background: var(--primary-dark, #1d4ed8); transform: scale(1.1); }
        .ach-dots { display: flex; gap: 6px; }
        .ach-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--border-color, #d1d5db);
            transition: background .3s, transform .3s;
            cursor: pointer;
        }
        .ach-dot.active { background: var(--primary-color, #2563eb); transform: scale(1.3); }

        /* ── Lightbox ── */
        #ach-lightbox {
            display: none;
            position: fixed; inset: 0;
            background: rgba(0,0,0,.88);
            z-index: 10000;
            align-items: center; justify-content: center;
            flex-direction: column;
            gap: 12px;
            padding: 20px;
        }
        #ach-lightbox.open { display: flex; }
        #ach-lightbox img {
            max-width: 90vw; max-height: 80vh;
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0,0,0,.6);
            animation: zoomIn .3s ease;
        }
        #ach-lightbox p {
            color: #fff; font-size: 1rem; font-weight: 500; text-align: center;
        }
        #ach-lightbox-close {
            position: absolute; top: 18px; right: 22px;
            color: #fff; font-size: 28px; cursor: pointer;
            background: none; border: none; line-height: 1;
        }
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(.85); }
            to   { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 600px) {
            .achievement-card { flex: 0 0 calc(100% - 0px); min-width: unset; }
        }
        @media (min-width: 601px) and (max-width: 900px) {
            .achievement-card { flex: 0 0 calc(50% - 10px); }
        }
    `;
    document.head.appendChild(style);
})();

// Build lightbox once
function buildLightbox() {
    if (document.getElementById('ach-lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'ach-lightbox';
    lb.innerHTML = `
        <button id="ach-lightbox-close" aria-label="Close">✕</button>
        <img id="ach-lb-img" src="" alt="">
        <p id="ach-lb-title"></p>
    `;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('open'); });
    document.getElementById('ach-lightbox-close').addEventListener('click', () => lb.classList.remove('open'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('open'); });
}

function openLightbox(src, title) {
    const lb = document.getElementById('ach-lightbox');
    if (!lb) return;
    document.getElementById('ach-lb-img').src   = src;
    document.getElementById('ach-lb-title').textContent = title || '';
    lb.classList.add('open');
}

let achCards       = [];   // array of { imgUrl, title }
let achIndex       = 0;    // leftmost visible card index
let achPerView     = 3;
let achAutoTimer   = null;

function getAchPerView() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
}

function renderAchTrack(track, dots) {
    achPerView = getAchPerView();
    const maxIndex = Math.max(0, achCards.length - achPerView);
    if (achIndex > maxIndex) achIndex = maxIndex;

    // Move track
    const cardWidth = track.querySelector('.achievement-card')?.offsetWidth || 0;
    const gap = 20;
    track.style.transform = `translateX(-${achIndex * (cardWidth + gap)}px)`;

    // Dots
    if (dots) {
        dots.innerHTML = '';
        const totalDots = Math.ceil(achCards.length / achPerView);
        const activeDot = Math.floor(achIndex / achPerView);
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('span');
            dot.className = 'ach-dot' + (i === activeDot ? ' active' : '');
            dot.addEventListener('click', () => { achIndex = i * achPerView; renderAchTrack(track, dots); });
            dots.appendChild(dot);
        }
    }
}

function slideAch(dir, track, dots) {
    achPerView = getAchPerView();
    const maxIndex = Math.max(0, achCards.length - achPerView);
    // Right-to-left auto: dir = +1 moves left visually (next)
    achIndex = achIndex + dir;
    if (achIndex > maxIndex) achIndex = 0;         // wrap
    if (achIndex < 0)        achIndex = maxIndex;  // wrap back
    renderAchTrack(track, dots);
}

function startAchAuto(track, dots) {
    if (achAutoTimer) clearInterval(achAutoTimer);
    achAutoTimer = setInterval(() => slideAch(1, track, dots), 3500); // auto RTL
}

function loadAchievements() {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;

    buildLightbox();
    gallery.innerHTML = `<p style="opacity:.5;text-align:center;width:100%;padding:20px;">Loading achievements…</p>`;

    waitForFirebase(() => {
        if (!window.firebaseDb) {
            gallery.innerHTML = `<p style="opacity:.5;text-align:center;width:100%;">Could not connect to database.</p>`;
            return;
        }
        const { collection, onSnapshot } = window.firebaseModules;

        onSnapshot(collection(window.firebaseDb, "achievements"), (snapshot) => {
            gallery.innerHTML = '';
            achCards = [];
            if (achAutoTimer) clearInterval(achAutoTimer);

            if (snapshot.empty) {
                gallery.innerHTML = `<p style="opacity:.5;text-align:center;width:100%;">No achievements uploaded yet.</p>`;
                return;
            }

            snapshot.forEach(doc => {
                const d = doc.data();
                const imgUrl = d.image || d.imageUrl || d.url || d.img || '';
                achCards.push({ imgUrl, title: d.title || '' });
            });

            // Build slider structure
            const wrap  = document.createElement('div');
            wrap.className = 'ach-slider-wrap';

            const track = document.createElement('div');
            track.className = 'ach-track';

            achCards.forEach(card => {
                const el = document.createElement('div');
                el.className = 'achievement-card';
                el.innerHTML = `
                    <img src="${card.imgUrl}" alt="${card.title}"
                         onerror="this.onerror=null;this.src='teclipse.png';this.style.opacity='.3';">
                    <p>${card.title}</p>
                `;
                el.addEventListener('click', () => openLightbox(card.imgUrl, card.title));
                track.appendChild(el);
            });

            wrap.appendChild(track);
            gallery.appendChild(wrap);

            // Controls
            const controls = document.createElement('div');
            controls.className = 'ach-controls';

            const btnPrev = document.createElement('button');
            btnPrev.className = 'ach-arrow';
            btnPrev.innerHTML = '&#8249;';
            btnPrev.setAttribute('aria-label', 'Previous');

            const dots = document.createElement('div');
            dots.className = 'ach-dots';

            const btnNext = document.createElement('button');
            btnNext.className = 'ach-arrow';
            btnNext.innerHTML = '&#8250;';
            btnNext.setAttribute('aria-label', 'Next');

            controls.appendChild(btnPrev);
            controls.appendChild(dots);
            controls.appendChild(btnNext);
            gallery.appendChild(controls);

            // Initial render (after a tick so widths are computed)
            achIndex = 0;
            setTimeout(() => {
                renderAchTrack(track, dots);
                startAchAuto(track, dots);
            }, 60);

            btnNext.addEventListener('click', () => { slideAch(1, track, dots); startAchAuto(track, dots); });
            btnPrev.addEventListener('click', () => { slideAch(-1, track, dots); startAchAuto(track, dots); });

            window.addEventListener('resize', () => renderAchTrack(track, dots));

        }, (err) => {
            console.error("Achievements error:", err);
            gallery.innerHTML = `<p style="color:red;text-align:center;width:100%;">Failed to load achievements.</p>`;
        });
    });
}

loadAchievements();

}); // end DOMContentLoaded
