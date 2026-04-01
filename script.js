// --- Theme Management ---
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
    if (savedTheme === 'dark') htmlEl.setAttribute('data-theme', 'dark'), updateIcon(true);
    else if (savedTheme === 'light') htmlEl.setAttribute('data-theme', 'light'), updateIcon(false);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) htmlEl.setAttribute('data-theme', 'dark'), updateIcon(true);
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

// --- Navbar Scroll & Mobile Menu ---
const navbar = document.getElementById('navbar');
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileSidebar = document.getElementById('mobile-sidebar');
const overlay = document.getElementById('sidebar-overlay');
const closeSidebar = document.getElementById('close-sidebar');

if (navbar) {
    let lastScroll = window.scrollY;
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const y = window.scrollY;
            navbar.classList.toggle('scrolled', y > 20);
            lastScroll = y;
        }, 60);
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

// --- Active Nav Link on Scroll ---
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-links a.mobile-nav-link');

function setActiveLink() {
    let current = '';
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (scrollY > sectionTop && scrollY <= sectionTop + section.offsetHeight) {
            current = section.getAttribute('id');
        }
    });

    if ((window.innerHeight + Math.round(scrollY)) >= document.body.offsetHeight - 50 && sections.length) {
        current = sections[sections.length - 1].getAttribute('id');
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (current && link.getAttribute('href') === `#${current}`) link.classList.add('active');
        else if (!current && scrollY < 300 && link.getAttribute('href') === '#home') link.classList.add('active');
    });
}

window.addEventListener('scroll', setActiveLink);
window.addEventListener('load', setActiveLink);

// --- Modals ---
const loginBtn = document.getElementById('login-btn');
const mobileLoginBtn = document.getElementById('mobile-login-btn');
const loginModal = document.getElementById('login-modal');
const closeModal = document.getElementById('close-modal');

if (loginBtn && loginModal) {
    loginBtn.addEventListener('click', () => loginModal.classList.add('show'));
    mobileLoginBtn.addEventListener('click', e => (e.preventDefault(), loginModal.classList.add('show')));
    closeModal.addEventListener('click', () => loginModal.classList.remove('show'));
    window.addEventListener('click', e => { if (e.target === loginModal) loginModal.classList.remove('show'); });
}

// --- Admin Login Form ---
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
        } else alert("Invalid Email or Password. Please ensure you use the correct Admin credentials.");
    });
}

// --- Star Rating ---
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

stars.forEach(star => {
    star.addEventListener('mouseover', () => highlightStars(star.getAttribute('data-value')));
    star.addEventListener('mouseout', () => highlightStars(ratingInput.value || 0));
    star.addEventListener('click', () => { ratingInput.value = star.getAttribute('data-value'); highlightStars(ratingInput.value); });
});

function highlightStars(value) {
    stars.forEach(star => {
        if (star.getAttribute('data-value') <= value) star.classList.replace('bx-star','bxs-star'), star.classList.add('active');
        else star.classList.replace('bxs-star','bx-star'), star.classList.remove('active');
    });
}

// --- Feedback Data Management & Testimonials ---
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

// Feedback submission
const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!ratingInput.value) return alert('Please select a star rating.');

        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        const name = document.getElementById('name').value.toUpperCase();
        const email = document.getElementById('email').value;
        const rating = parseInt(ratingInput.value);
        const message = document.getElementById('message').value;

        try {
            if (window.firebaseDb && window.firebaseModules) {
                const { collection, addDoc, query, orderBy, getDocs } = window.firebaseModules;

                // Save to Firebase
                await addDoc(collection(window.firebaseDb, "feedbacks"), { name, email, rating, message, date: new Date().toLocaleDateString(), timestamp: Date.now() });

                // Immediately fetch all feedbacks to update slider
                const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));
                const snapshot = await getDocs(q);
                const feedbacks = [];
                snapshot.forEach(doc => feedbacks.push({ id: doc.id, ...doc.data() }));
                renderTestimonials(feedbacks);

            } else throw new Error("Firebase not ready");

        } catch (err) {
            console.error(err);
            alert("Failed to submit feedback. Try again.");
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            feedbackForm.reset();
            ratingInput.value = '';
            highlightStars(0);
        }
    });
}

// --- Testimonial Slider ---
let currentSlide = 0;
let slideElements = [];
let slideInterval;

function generateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) html += i <= rating ? "<i class='bx bxs-star'></i>" : "<i class='bx bx-star'></i>";
    return html;
}

function renderTestimonials(feedbacks = []) {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;
    slider.innerHTML = '';
    if (feedbacks.length === 0) { slider.innerHTML = '<div class="empty-state">No reviews yet.</div>'; return; }
    feedbacks.forEach((fb, index) => {
        const slide = document.createElement('div');
        slide.className = `testimonial-slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `<div class="stars">${generateStars(fb.rating)}</div><p class="review-text">"${fb.message}"</p><h4 class="reviewer-name">- ${fb.name}</h4>`;
        slider.appendChild(slide);
    });
    slideElements = document.querySelectorAll('.testimonial-slide');
    currentSlide = 0;
    startAutoSlide();
}

function nextSlide() { if (slideElements.length <= 1) return; slideElements[currentSlide].classList.remove('active'); currentSlide++; if (currentSlide >= slideElements.length) currentSlide = 0; slideElements[currentSlide].classList.add('active'); }
function prevSlide() { if (slideElements.length <= 1) return; slideElements[currentSlide].classList.remove('active'); currentSlide--; if (currentSlide < 0) currentSlide = slideElements.length - 1; slideElements[currentSlide].classList.add('active'); }
function startAutoSlide() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 3000); }

if (document.getElementById('testimonial-slider')) {
    document.getElementById('next-btn').addEventListener('click', () => (nextSlide(), startAutoSlide()));
    document.getElementById('prev-btn').addEventListener('click', () => (prevSlide(), startAutoSlide()));
    const sliderContainer = document.querySelector('.testimonial-slider-container');
    sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
    sliderContainer.addEventListener('mouseleave', () => startAutoSlide());
}

// --- Achievements Rendering ---
let achievementSlideInterval;
async function fetchAchievements() {
    if (!window.firebaseDb) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
    if (!document.getElementById('achievements-gallery')) return;
    const q = query(collection(window.firebaseDb, "achievements"), orderBy("timestamp", "desc"));
    onSnapshot(q, snapshot => renderMainAchievements(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
}

function renderMainAchievements(achievements = []) {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;
    gallery.innerHTML = achievements.length === 0 ? '<div style="text-align:center;color:#999;">No achievements uploaded yet.</div>' :
        achievements.map((ach, i) => `<div class="achievement-card" id="ach-card-${i}"><img src="${ach.url}" alt="${ach.title}"><div style="padding:1rem;text-align:center;"><h4>${ach.title}</h4></div></div>`).join('');

    slideAchievementGallery();
}

function slideAchievementGallery() {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;
    const cards = document.querySelectorAll('.achievement-card');
    let currentIndex = 0;
    function scrollToCard(i) { if (!cards[i]) return; gallery.scrollTo({ left: cards[i].offsetLeft - (gallery.clientWidth/2) + (cards[i].clientWidth/2), behavior: 'smooth' }); }
    function next() { currentIndex = (currentIndex+1) % cards.length; scrollToCard(currentIndex); }
    function prev() { currentIndex = (currentIndex-1+cards.length) % cards.length; scrollToCard(currentIndex); }
    document.getElementById('ach-next-btn').onclick = () => (next(), startAchAutoSlide());
    document.getElementById('ach-prev-btn').onclick = () => (prev(), startAchAutoSlide());
    function startAchAutoSlide() { clearInterval(achievementSlideInterval); achievementSlideInterval = setInterval(next, 2500); }
    startAchAutoSlide();
}

function initializeFirebaseListeners() { if (window.firebaseDb && window.firebaseModules) { fetchFeedbacks(); fetchAchievements(); } else setTimeout(initializeFirebaseListeners, 100); }
initializeFirebaseListeners();
