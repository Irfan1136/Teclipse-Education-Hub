document.addEventListener("DOMContentLoaded", () => {

console.log("JS LOADED ✅");

/* ================= TOAST NOTIFICATION (replaces all alert()) ================= */
function showToast(message, type = "info") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 99999;
            display: flex; flex-direction: column; gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    const icons  = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white; padding: 13px 18px; border-radius: 10px;
        font-size: 14px; font-weight: 500;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        opacity: 0; transform: translateX(60px);
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-width: 340px; pointer-events: auto;
        display: flex; align-items: center; gap: 8px;
    `;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(60px)';
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

/* ================= THEME ================= */
const htmlEl = document.documentElement;

function updateIcon(isDark) {
    document.querySelectorAll('#theme-icon, #theme-icon-admin').forEach(icon => {
        icon.classList.toggle('bx-sun', isDark);
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

/* ================= NAVBAR ================= */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
});

/* ================= ADMIN MODAL ================= */
const loginBtn       = document.getElementById("login-btn");
const mobileLoginBtn = document.getElementById("mobile-login-btn");
const modal          = document.getElementById("login-modal");
const closeModal     = document.getElementById("close-modal");

if (loginBtn)       loginBtn.onclick       = () => modal.style.display = "flex";
if (mobileLoginBtn) mobileLoginBtn.onclick = () => modal.style.display = "flex";
if (closeModal)     closeModal.onclick     = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

/* ================= ADMIN LOGIN ================= */
// Calls: POST /api/adminlogin  →  api/adminlogin.js on Vercel
const adminForm = document.getElementById('admin-login-form');

if (adminForm) {
    adminForm.addEventListener('submit', async e => {
        e.preventDefault();

        const email    = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-pass').value;
        const submitBtn = adminForm.querySelector('button[type="submit"]');

        if (!email || !password) {
            showToast("Please fill in all fields", "warning");
            return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Logging in..."; }

        try {
            const res = await fetch("/api/adminlogin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            let data;
            try { data = await res.json(); }
            catch { throw new Error("Invalid server response"); }

            if (res.ok && data.success) {
                localStorage.setItem('teclipse_admin_auth', 'true');
                showToast("Login successful! Redirecting...", "success");
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

/* ================= STAR RATING ================= */
const stars       = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

stars.forEach(star => {
    star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        if (ratingInput) ratingInput.value = value;

        stars.forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.value) <= value);
        });
    });
});

/* ================= FEEDBACK ================= */
// Calls: POST /api/sendemail  →  api/sendemail.js on Vercel
const feedbackForm = document.getElementById('feedback-form');

if (feedbackForm) {
    feedbackForm.addEventListener('submit', async e => {
        e.preventDefault();

        if (!ratingInput || !ratingInput.value) {
            showToast("Please select a star rating ⭐", "warning");
            return;
        }

        const name    = document.getElementById('name').value.trim();
        const email   = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const rating  = parseInt(ratingInput.value);

        if (!name || !email || !message) {
            showToast("Please fill in all fields", "warning");
            return;
        }

        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }

        try {
            // 1. Save to Firebase Firestore
            if (window.firebaseDb && window.firebaseModules) {
                const { collection, addDoc } = window.firebaseModules;
                await addDoc(collection(window.firebaseDb, "feedbacks"), {
                    name, email, message, rating,
                    timestamp: Date.now()
                });
            }

            // 2. Send email via Brevo (api/sendemail.js)
            const emailRes = await fetch("/api/sendemail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message, rating })
            });

            if (!emailRes.ok) {
                // Feedback saved to DB, email failed — log but don't alarm user
                console.warn("Email send failed, feedback was still saved.");
            }

            showToast("Feedback submitted! Thank you 🎉", "success");
            feedbackForm.reset();
            if (ratingInput) ratingInput.value = '';
            stars.forEach(s => s.classList.remove('active'));

        } catch (err) {
            console.error("Feedback submit error:", err);
            showToast("Error submitting feedback. Please try again.", "error");
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Submit Feedback"; }
        }
    });
}

/* ================= TESTIMONIALS ================= */
// Reads from Firebase "feedbacks" collection
let currentSlide = 0;
let sliderInterval;

function startSlider() {
    if (sliderInterval) clearInterval(sliderInterval);

    sliderInterval = setInterval(() => {
        const slides = document.querySelectorAll('.testimonial-slide');
        if (slides.length < 2) return;

        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 3000);
}

function loadTestimonials() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;

    slider.innerHTML = `<div class="testimonial-slide active" style="opacity:0.5;text-align:center;padding:20px;">
        <p>Loading testimonials...</p>
    </div>`;

    // FIX: Poll until Firebase is ready (it loads async — DOMContentLoaded fires before Firebase init)
    let attempts = 0;
    function tryLoad() {
        attempts++;
        if (window.firebaseDb && window.firebaseModules) {
            const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
            const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));

            onSnapshot(q, (snapshot) => {
                slider.innerHTML = "";
                currentSlide = 0;
                if (sliderInterval) clearInterval(sliderInterval);

                if (snapshot.empty) {
                    slider.innerHTML = `<div class="testimonial-slide active">
                        <p>"Be the first to leave a review!"</p>
                        <h4>— Teclipse Team</h4>
                    </div>`;
                    return;
                }

                let index = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.className = 'testimonial-slide';
                    if (index === 0) div.classList.add('active');

                    const starsHtml = data.rating
                        ? `<span style="font-size:15px;letter-spacing:2px;">${'⭐'.repeat(Math.min(parseInt(data.rating), 5))}</span>`
                        : '';

                    div.innerHTML = `
                        <p>"${data.message || ''}"</p>
                        <h4>— ${data.name || 'Anonymous'}</h4>
                        ${starsHtml}
                    `;
                    slider.appendChild(div);
                    index++;
                });

                startSlider();

            }, (err) => {
                console.error("Testimonials onSnapshot error:", err);
                slider.innerHTML = `<div class="testimonial-slide active"><p>"Could not load testimonials."</p></div>`;
            });

        } else if (attempts < 20) {
            // Retry every 500ms, max 10 seconds
            setTimeout(tryLoad, 500);
        } else {
            slider.innerHTML = `<div class="testimonial-slide active"><p>"Could not connect to database."</p></div>`;
        }
    }
    tryLoad();
}

loadTestimonials();

/* Prev / Next controls */
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");

if (nextBtn) {
    nextBtn.onclick = () => {
        const slides = document.querySelectorAll('.testimonial-slide');
        if (slides.length === 0) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    };
}

if (prevBtn) {
    prevBtn.onclick = () => {
        const slides = document.querySelectorAll('.testimonial-slide');
        if (slides.length === 0) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    };
}

/* ================= ACHIEVEMENTS ================= */
// Reads from Firebase "achievements" collection
function loadAchievements() {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;

    gallery.innerHTML = `<p style="opacity:0.5;text-align:center;width:100%;">Loading achievements...</p>`;

    let attempts = 0;
    function tryLoad() {
        attempts++;
        if (window.firebaseDb && window.firebaseModules) {
            const { collection, onSnapshot } = window.firebaseModules;

            onSnapshot(collection(window.firebaseDb, "achievements"), (snapshot) => {
                gallery.innerHTML = "";

                if (snapshot.empty) {
                    gallery.innerHTML = `<p style="opacity:0.5;text-align:center;width:100%;">No achievements uploaded yet.</p>`;
                    return;
                }

                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Supports all possible image field names from admin.js uploads
                    const imgUrl = data.image || data.imageUrl || data.url || data.img || '';

                    const card = document.createElement('div');
                    card.className = "achievement-card";
                    card.innerHTML = `
                        <img
                            src="${imgUrl}"
                            alt="${data.title || 'Achievement'}"
                            style="width:100%; border-radius:10px; object-fit:cover;"
                            onerror="this.onerror=null; this.src='teclipse.png'; this.style.opacity='0.3';"
                        >
                        <p>${data.title || ''}</p>
                    `;
                    gallery.appendChild(card);
                });

            }, (err) => {
                console.error("Achievements onSnapshot error:", err);
                gallery.innerHTML = `<p style="color:red;text-align:center;width:100%;">Failed to load achievements.</p>`;
            });

        } else if (attempts < 20) {
            setTimeout(tryLoad, 500);
        } else {
            gallery.innerHTML = `<p style="opacity:0.5;text-align:center;width:100%;">Could not connect to database.</p>`;
        }
    }
    tryLoad();
}

loadAchievements();

});
