// ================================
// --- Theme Management --- 
// ================================
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
    } else if (savedTheme === 'light') {
        htmlEl.setAttribute('data-theme', 'light');
        updateIcon(false);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlEl.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        updateIcon(prefersDark);
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

// ================================
// --- Navbar Scroll & Mobile Menu --- 
// ================================
const navbar = document.getElementById('navbar');
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileSidebar = document.getElementById('mobile-sidebar');
const overlay = document.getElementById('sidebar-overlay');
const closeSidebar = document.getElementById('close-sidebar');

if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
}

function toggleMenu() {
    mobileSidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
if (closeSidebar) closeSidebar.addEventListener('click', toggleMenu);
if (overlay) overlay.addEventListener('click', toggleMenu);

document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileSidebar.classList.remove('open');
        overlay.classList.remove('open');
    });
});

// ================================
// --- Active Nav Link on Scroll --- 
// ================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-links a.mobile-nav-link');

function setActiveLink() {
    let current = '';
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            current = section.id;
        }
    });

    if ((window.innerHeight + Math.round(scrollY)) >= document.body.offsetHeight - 50) {
        if (sections.length > 0) current = sections[sections.length - 1].id;
    }

    navLinks.forEach(link => link.classList.remove('active'));
    navLinks.forEach(link => {
        if (current && link.getAttribute('href') === `#${current}`) link.classList.add('active');
        else if (!current && scrollY < 300 && link.getAttribute('href') === '#home') link.classList.add('active');
    });
}

window.addEventListener('scroll', setActiveLink);
window.addEventListener('load', setActiveLink);

// ================================
// --- Modals & Admin Login --- 
// ================================
const loginModal = document.getElementById('login-modal');
const loginBtns = [document.getElementById('login-btn'), document.getElementById('mobile-login-btn')];
const closeModal = document.getElementById('close-modal');

loginBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', e => {
        if (e) e.preventDefault();
        loginModal.classList.add('show');
    });
});

if (closeModal) closeModal.addEventListener('click', () => loginModal.classList.remove('show'));
window.addEventListener('click', e => { if (e.target === loginModal) loginModal.classList.remove('show'); });

const adminForm = document.getElementById('admin-login-form');
if (adminForm) {
    adminForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;
        const storedPass = localStorage.getItem('teclipse_admin_password') || '2003@esai';
        if (email === 'teclipseeducationhub@gmail.com' && pass === storedPass) {
            localStorage.setItem('teclipse_admin_auth', 'true');
            window.location.href = 'admin.html';
        } else {
            alert("Invalid Email or Password. Please ensure you use the correct Admin credentials.");
        }
    });
}

// ================================
// --- Star Rating --- 
// ================================
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

function highlightStars(value) {
    stars.forEach(star => {
        const val = star.dataset.value;
        star.classList.toggle('bxs-star', val <= value);
        star.classList.toggle('bx-star', val > value);
    });
}

stars.forEach(star => {
    star.addEventListener('mouseover', () => highlightStars(star.dataset.value));
    star.addEventListener('mouseout', () => highlightStars(ratingInput.value || 0));
    star.addEventListener('click', () => {
        ratingInput.value = star.dataset.value;
        highlightStars(star.dataset.value);
    });
});

// ================================
// --- Firebase Achievements & Testimonials --- 
// ================================
function renderMainAchievements(achievements) {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    achievements.forEach(a => {
        const div = document.createElement('div');
        div.classList.add('achievement-card');
        div.innerHTML = `<img src="${a.image}" alt="${a.title}"><h4>${a.title}</h4>`;
        gallery.appendChild(div);
    });
}

function renderTestimonials(feedbacks) {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;
    slider.innerHTML = '';
    feedbacks.forEach(f => {
        const div = document.createElement('div');
        div.classList.add('testimonial-slide');
        div.innerHTML = `<p>"${f.message}"</p><h4>${f.name}</h4>`;
        slider.appendChild(div);
    });
}

// ================================
// --- Fetch Firebase Data --- 
// ================================
async function fetchFeedbacks() {
    if (!window.firebaseDb) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
    const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));
    onSnapshot(q, snapshot => {
        const feedbacks = [];
        snapshot.forEach(doc => feedbacks.push({ id: doc.id, ...doc.data() }));
        renderTestimonials(feedbacks);
    });
}

async function fetchAchievements() {
    if (!window.firebaseDb) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;
    const q = query(collection(window.firebaseDb, "achievements"), orderBy("timestamp", "desc"));
    onSnapshot(q, snapshot => {
        const achievements = [];
        snapshot.forEach(doc => achievements.push({ id: doc.id, ...doc.data() }));
        renderMainAchievements(achievements);
    });
}

// ================================
// --- Feedback Form Submit --- 
// ================================
const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!window.firebaseDb) return alert("Firebase not initialized!");
        const { collection, addDoc } = window.firebaseModules;
        try {
            await addDoc(collection(window.firebaseDb, "feedbacks"), {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                rating: document.getElementById('rating-value').value || 0,
                timestamp: new Date()
            });
            alert("Feedback submitted successfully!");
            feedbackForm.reset();
            ratingInput.value = 0;
            highlightStars(0);
        } catch (err) {
            console.error("Feedback error:", err);
            alert("Failed to submit feedback. Try again later.");
        }
    });
}

// ================================
// --- Initialize Firebase Listeners --- 
// ================================
function initializeFirebaseListeners() {
    if (window.firebaseDb && window.firebaseModules) {
        fetchFeedbacks();
        fetchAchievements();
    } else {
        setTimeout(initializeFirebaseListeners, 100);
    }
}
initializeFirebaseListeners();
