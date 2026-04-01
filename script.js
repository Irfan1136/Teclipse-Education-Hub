document.addEventListener("DOMContentLoaded", () => {

console.log("JS LOADED ✅");

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

/* ================= MOBILE MENU ================= */
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}

/* ================= ADMIN MODAL ================= */
const loginBtn = document.getElementById("login-btn");
const mobileLoginBtn = document.getElementById("mobile-login-btn");
const modal = document.getElementById("login-modal");
const closeModal = document.getElementById("close-modal");

if (loginBtn && modal) {
    loginBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });
}

if (mobileLoginBtn && modal) {
    mobileLoginBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });
}

if (closeModal && modal) {
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

            if (!res.ok) throw new Error("API error");

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('teclipse_admin_auth', 'true');
                window.location.href = 'admin.html';
            } else {
                alert("Invalid credentials");
            }

        } catch (err) {
            console.error(err);
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

        if (!ratingInput.value) {
            alert("Select rating");
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const rating = parseInt(ratingInput.value);

        try {
            // Firebase save
            if (window.firebaseDb && window.firebaseModules) {
                const { collection, addDoc } = window.firebaseModules;

                await addDoc(collection(window.firebaseDb, "feedbacks"), {
                    name,
                    email,
                    message,
                    rating,
                    timestamp: Date.now()
                });
            }

            // Email API
            const res = await fetch("/api/sendemail", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ name, email, message, rating })
            });

            if (!res.ok) throw new Error("Email failed");

            alert("Feedback sent!");
            feedbackForm.reset();
            ratingInput.value = '';

        } catch (err) {
            console.error(err);
            alert("Error submitting feedback");
        }
    });
}

/* ================= TESTIMONIALS ================= */
let currentSlide = 0;
let sliderInterval;

function showSlide(index) {
    const slides = document.querySelectorAll('.testimonial-slide');
    if (slides.length === 0) return;

    slides.forEach(slide => slide.classList.remove('active'));

    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

function startSlider() {
    if (sliderInterval) clearInterval(sliderInterval);

    sliderInterval = setInterval(() => {
        showSlide(currentSlide + 1);
    }, 3000);
}

function loadTestimonials() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider || !window.firebaseDb) return;

    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;

    const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        slider.innerHTML = "";
        currentSlide = 0;

        snapshot.forEach((doc, index) => {
            const data = doc.data();

            const div = document.createElement('div');
            div.className = 'testimonial-slide';
            if (index === 0) div.classList.add('active');

            div.innerHTML = `
                <p style="color: var(--text-color);">"${data.message}"</p>
                <h4 style="color: var(--text-color);">- ${data.name}</h4>
            `;

            slider.appendChild(div);
        });

        startSlider();
    });
}

/* BUTTON CONTROLS */
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");

if (nextBtn) nextBtn.addEventListener("click", () => showSlide(currentSlide + 1));
if (prevBtn) prevBtn.addEventListener("click", () => showSlide(currentSlide - 1));

/* ================= ACHIEVEMENTS ================= */
function loadAchievements() {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery || !window.firebaseDb) return;

    const { collection, onSnapshot } = window.firebaseModules;

    onSnapshot(collection(window.firebaseDb, "achievements"), (snapshot) => {
        gallery.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data();
            const imgUrl = data.image || data.imageUrl;

            if (!imgUrl) return;

            const card = document.createElement('div');
            card.className = "achievement-card";

            card.innerHTML = `
                <img src="${imgUrl}" 
                onerror="this.src='fallback.png'"
                style="width:100%; border-radius:10px;">
                <p>${data.title || ''}</p>
            `;

            gallery.appendChild(card);
        });
    });
}

/* ================= WAIT FOR FIREBASE ================= */
function waitForFirebase(callback) {
    const interval = setInterval(() => {
        if (window.firebaseDb && window.firebaseModules) {
            clearInterval(interval);
            callback();
        }
    }, 100);
}

waitForFirebase(() => {
    loadTestimonials();
    loadAchievements();
});

});
