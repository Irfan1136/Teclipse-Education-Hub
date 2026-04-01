// ================= THEME =================
const themeToggles = document.querySelectorAll('#theme-toggle, #theme-toggle-admin');
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

themeToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('teclipse-theme', newTheme);
        updateIcon(newTheme === 'dark');
    });
});

initTheme();

// ================= NAVBAR =================
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ================= ADMIN LOGIN =================
const adminForm = document.getElementById('admin-login-form');

if (adminForm) {
    adminForm.addEventListener('submit', async e => {
        e.preventDefault();

        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;

        try {
            const res = await fetch("/api/adminlogin", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ email, password: pass })
            });

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

// ================= STAR RATING =================
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

stars.forEach(star => {
    star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        ratingInput.value = value;
        highlightStars(value);
    });
});

function highlightStars(value) {
    stars.forEach(star => {
        star.classList.toggle('active', parseInt(star.dataset.value) <= value);
    });
}

// ================= FEEDBACK =================
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
            // FIREBASE SAVE
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

            // EMAIL API (CASE FIXED)
            await fetch("/api/sendemail", {   // ✅ FIXED CASE
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ name, email, message, rating })
            });

            alert("Feedback sent!");
            feedbackForm.reset();
            ratingInput.value = '';
            highlightStars(0);

        } catch (err) {
            console.error(err);
            alert("Error submitting");
        }
    });
}

// ================= TESTIMONIALS (🔥 FIXED MAIN ISSUE) =================
function loadTestimonials() {
    const slider = document.getElementById('testimonial-slider');
    if (!slider || !window.firebaseDb) return;

    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;

    const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        slider.innerHTML = "";

        let index = 0;

        snapshot.forEach(doc => {
            const data = doc.data();

            const stars = "★".repeat(data.rating || 0);

            const div = document.createElement('div');
            div.className = 'testimonial-slide';
            if (index === 0) div.classList.add('active');

            div.innerHTML = `
                <div class="stars">${stars}</div>
                <p class="review-text">"${data.message}"</p>
                <h4 class="reviewer-name">- ${data.name}</h4>
            `;

            slider.appendChild(div);
            index++;
        });

        startSlider();
    });
}

let currentSlide = 0;
function startSlider() {
    const slides = document.querySelectorAll('.testimonial-slide');

    if (slides.length === 0) return;

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 3000);
}

loadTestimonials();

// ================= ACHIEVEMENTS (🔥 FIXED) =================
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
                <img src="${data.image}" style="width:100%; border-radius:10px;">
                <p>${data.title || ''}</p>
            `;

            gallery.appendChild(card);
        });
    });
}

loadAchievements();// --- Theme Management ---
const themeToggles = document.querySelectorAll('#theme-toggle, #theme-toggle-admin');
const htmlEl = document.documentElement;

function updateIcon(isDark) {
    document.querySelectorAll('#theme-icon, #theme-icon-admin').forEach(icon => {
        icon.classList.toggle('bx-sun', isDark);
        icon.classList.toggle('bx-moon', !isDark);
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('teclipse-theme');
    if (savedTheme === 'dark') {
        htmlEl.setAttribute('data-theme', 'dark');
        updateIcon(true);
    } else {
        htmlEl.setAttribute('data-theme', 'light');
        updateIcon(false);
    }
}

themeToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('teclipse-theme', newTheme);
        updateIcon(newTheme === 'dark');
    });
});

initTheme();

// --- Navbar ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// --- Admin Login (Backend Secure) ---
const adminForm = document.getElementById('admin-login-form');

if (adminForm) {
    adminForm.addEventListener('submit', async e => {
        e.preventDefault();

        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;

        try {
            const res = await fetch("/api/adminlogin", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ email, password: pass })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('teclipse_admin_auth', 'true');
                window.location.href = 'admin.html';
            } else {
                alert("Invalid credentials");
            }

        } catch {
            alert("Login failed");
        }
    });
}

// --- Star Rating ---
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

stars.forEach(star => {
    star.addEventListener('click', () => {
        ratingInput.value = star.getAttribute('data-value');
        highlightStars(ratingInput.value);
    });
});

function highlightStars(value) {
    stars.forEach(star => {
        if (star.getAttribute('data-value') <= value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// --- Feedback + Email ---
const feedbackForm = document.getElementById('feedback-form');

if (feedbackForm) {
    feedbackForm.addEventListener('submit', async e => {
        e.preventDefault();

        if (!ratingInput.value) {
            alert("Please select rating");
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const rating = parseInt(ratingInput.value);

        try {
            // Save to Firebase
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

            // Send Email (WITH RATING)
            await fetch("/api/sendemail", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ name, email, message, rating })
            });

            alert("Feedback submitted successfully!");
            feedbackForm.reset();
            ratingInput.value = '';
            highlightStars(0);

        } catch (err) {
            console.error(err);
            alert("Error submitting feedback");
        }
    });
}

// --- TESTIMONIAL SLIDER ---
let currentSlide = 0;
let slides = [];

function renderTestimonials(feedbacks = []) {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;

    slider.innerHTML = "";

    feedbacks.forEach((fb, i) => {
        const div = document.createElement('div');
        div.className = 'testimonial-slide';
        if (i === 0) div.classList.add('active');

        div.innerHTML = `
            <p>"${fb.message}"</p>
            <h4>- ${fb.name}</h4>
        `;

        slider.appendChild(div);
    });

    slides = document.querySelectorAll('.testimonial-slide');
    currentSlide = 0;
}

function nextSlide() {
    if (slides.length === 0) return;

    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

setInterval(nextSlide, 3000);

// --- ACHIEVEMENT SLIDER ---
function slideAchievementGallery() {
    const gallery = document.getElementById('achievements-gallery');
    const cards = document.querySelectorAll('.achievement-card');

    let index = 0;

    setInterval(() => {
        index++;
        if (index >= cards.length) index = 0;

        gallery.style.transform = `translateX(-${index * 100}%)`;
    }, 3000);
}

slideAchievementGallery();
