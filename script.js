document.addEventListener("DOMContentLoaded", () => {

console.log("JS LOADED ✅");

/* ================= THEME ================= */
const htmlEl = document.documentElement;

function updateIcon(isDark) {
    document.querySelectorAll('#theme-icon').forEach(icon => {
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

document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('teclipse-theme', newTheme);
    updateIcon(newTheme === 'dark');
});

initTheme();

/* ================= MOBILE SIDEBAR ================= */
const menuBtn = document.getElementById("mobile-menu-btn");
const sidebar = document.getElementById("mobile-sidebar");
const overlay = document.getElementById("sidebar-overlay");
const closeSidebar = document.getElementById("close-sidebar");

if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.add("active");
        overlay.classList.add("active");
    });
}

if (closeSidebar) {
    closeSidebar.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
}

if (overlay) {
    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
}

/* ================= ADMIN MODAL ================= */
const loginBtn = document.getElementById("login-btn");
const mobileLoginBtn = document.getElementById("mobile-login-btn");
const modal = document.getElementById("login-modal");
const closeModal = document.getElementById("close-modal");

function openModal() {
    if (modal) modal.style.display = "flex";
}

if (loginBtn) loginBtn.addEventListener("click", openModal);
if (mobileLoginBtn) mobileLoginBtn.addEventListener("click", openModal);

if (closeModal) {
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});

/* ================= ADMIN LOGIN ================= */
const adminForm = document.getElementById('admin-login-form');

if (adminForm) {
    adminForm.addEventListener('submit', async e => {
        e.preventDefault();

        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-pass').value;

        try {
            const res = await fetch("/api/adminlogin", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('teclipse_admin_auth', 'true');
                window.location.href = 'admin.html';
            } else {
                alert("Invalid credentials");
            }

        } catch (err) {
            alert("Server error");
        }
    });
}

/* ================= STAR RATING ================= */
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

stars.forEach(star => {
    star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        ratingInput.value = value;

        stars.forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.value) <= value);
        });
    });
});

/* ================= FEEDBACK ================= */
const feedbackForm = document.getElementById('feedback-form');

if (feedbackForm) {
    feedbackForm.addEventListener('submit', async e => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const rating = ratingInput.value;

        try {
            // Firebase save
            if (window.firebaseDb && window.firebaseModules) {
                const { collection, addDoc } = window.firebaseModules;
                await addDoc(collection(window.firebaseDb, "feedbacks"), {
                    name, email, message, rating, timestamp: Date.now()
                });
            }

            // Email API
            const res = await fetch("/api/sendemail", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ name, email, message, rating })
            });

            if (!res.ok) throw new Error();

            alert("Feedback sent ✅");
            feedbackForm.reset();

        } catch {
            alert("Mail not sending ❌ (Check Vercel ENV)");
        }
    });
}

/* ================= TESTIMONIALS ================= */
let currentSlide = 0;

function showSlide(index) {
    const slides = document.querySelectorAll('.testimonial-slide');
    if (!slides.length) return;

    slides.forEach(s => s.classList.remove('active'));

    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

function loadTestimonials() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider || !window.firebaseDb) return;

    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;

    const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        slider.innerHTML = "";

        snapshot.forEach((doc, i) => {
            const d = doc.data();

            const div = document.createElement('div');
            div.className = 'testimonial-slide';
            if (i === 0) div.classList.add('active');

            div.innerHTML = `
                <p class="testimonial-text">"${d.message}"</p>
                <h4 class="testimonial-name">- ${d.name}</h4>
            `;

            slider.appendChild(div);
        });
    });
}

/* BUTTONS */
document.getElementById("next-btn")?.addEventListener("click", () => showSlide(currentSlide + 1));
document.getElementById("prev-btn")?.addEventListener("click", () => showSlide(currentSlide - 1));

/* ================= ACHIEVEMENTS ================= */
function loadAchievements() {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery || !window.firebaseDb) return;

    const { collection, onSnapshot } = window.firebaseModules;

    onSnapshot(collection(window.firebaseDb, "achievements"), (snapshot) => {
        gallery.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data();

            const card = document.createElement('div');
            card.className = "achievement-card";

            card.innerHTML = `
                <img src="${data.imageUrl}" style="width:100%">
                <p>${data.title}</p>
            `;

            gallery.appendChild(card);
        });
    });
}

/* WAIT FIREBASE */
const wait = setInterval(() => {
    if (window.firebaseDb) {
        clearInterval(wait);
        loadTestimonials();
        loadAchievements();
    }
}, 100);

});
