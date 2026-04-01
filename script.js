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
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlEl.setAttribute('data-theme', 'dark');
        updateIcon(true);
    } else {
        htmlEl.setAttribute('data-theme', 'light');
        updateIcon(false);
    }
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
        if (scrollY > section.offsetTop - 150 && scrollY <= section.offsetTop + section.offsetHeight) {
            current = section.id;
        }
    });
    if ((window.innerHeight + Math.round(scrollY)) >= document.body.offsetHeight - 50) {
        current = sections[sections.length - 1]?.id || current;
    }

    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
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
    mobileLoginBtn.addEventListener('click', e => { e.preventDefault(); loginModal.classList.add('show'); });
    closeModal.addEventListener('click', () => loginModal.classList.remove('show'));
    window.addEventListener('click', e => { if (e.target === loginModal) loginModal.classList.remove('show'); });
}

// --- Admin Login Form via Vercel API ---
const adminForm = document.getElementById('admin-login-form');
if (adminForm) {
    adminForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;

        try {
            const res = await fetch('https://yourproject.vercel.app/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('teclipse_admin_auth', 'true');
                window.location.href = 'admin.html';
            } else {
                alert('Invalid credentials.');
            }
        } catch (err) { console.error(err); alert('Login failed.'); }
    });
}

// --- Star Rating ---
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');
stars.forEach(star => {
    star.addEventListener('mouseover', () => highlightStars(star.dataset.value));
    star.addEventListener('mouseout', () => highlightStars(ratingInput.value || 0));
    star.addEventListener('click', () => { ratingInput.value = star.dataset.value; highlightStars(star.dataset.value); });
});
function highlightStars(value) {
    stars.forEach(star => {
        star.classList.toggle('bxs-star', star.dataset.value <= value);
        star.classList.toggle('bx-star', star.dataset.value > value);
        star.classList.toggle('active', star.dataset.value <= value);
    });
}

// --- Feedback Form via Vercel API + Firebase ---
const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!ratingInput.value) return alert('Select a rating.');

        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';

        const name = document.getElementById('name').value.toUpperCase();
        const email = document.getElementById('email').value;
        const rating = parseInt(ratingInput.value);
        const message = document.getElementById('message').value;

        try {
            if (window.firebaseDb && window.firebaseModules) {
                const { collection, addDoc } = window.firebaseModules;
                await addDoc(collection(window.firebaseDb, "feedbacks"), { name, email, rating, message, timestamp: Date.now() });
            }

            await fetch('https://yourproject.vercel.app/api/sendemail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, rating, message })
            });
            alert('Feedback submitted successfully!');
            feedbackForm.reset();
            ratingInput.value = '';
            highlightStars(0);
        } catch (err) { console.error(err); alert('Failed to submit feedback.'); }
        finally { submitBtn.disabled = false; submitBtn.innerText = originalText; }
    });
}

// --- Testimonials Slider ---
let currentSlide = 0;
let slideElements = [];
let slideInterval;
function generateStars(r) { return Array.from({length:5}, (_,i)=>i<r?'<i class="bx bxs-star"></i>':'<i class="bx bx-star"></i>').join(''); }
function renderTestimonials(feedbacks=[]) {
    const slider = document.getElementById('testimonial-slider'); if (!slider) return;
    slider.innerHTML = feedbacks.length ? feedbacks.map((fb,i)=>`<div class="testimonial-slide ${i===0?'active':''}"><div class="stars">${generateStars(fb.rating)}</div><p>"${fb.message}"</p><h4>- ${fb.name}</h4></div>`).join('') : '<div class="empty-state">No reviews yet.</div>';
    slideElements = document.querySelectorAll('.testimonial-slide');
    currentSlide = 0;
    startAutoSlide();
}
function nextSlide() { if (slideElements.length<2) return; slideElements[currentSlide].classList.remove('active'); currentSlide=(currentSlide+1)%slideElements.length; slideElements[currentSlide].classList.add('active'); }
function prevSlide() { if (slideElements.length<2) return; slideElements[currentSlide].classList.remove('active'); currentSlide=(currentSlide-1+slideElements.length)%slideElements.length; slideElements[currentSlide].classList.add('active'); }
function startAutoSlide() { clearInterval(slideInterval); slideInterval=setInterval(nextSlide,3000); }
if (document.getElementById('testimonial-slider')) {
    renderTestimonials();
    document.getElementById('next-btn')?.addEventListener('click',()=>{ nextSlide(); startAutoSlide(); });
    document.getElementById('prev-btn')?.addEventListener('click',()=>{ prevSlide(); startAutoSlide(); });
    const sliderContainer=document.querySelector('.testimonial-slider-container');
    sliderContainer?.addEventListener('mouseenter',()=>clearInterval(slideInterval));
    sliderContainer?.addEventListener('mouseleave',()=>startAutoSlide());
}

// --- Firebase Achievements ---
function initializeFirebaseListeners() {
    if (window.firebaseDb && window.firebaseModules) {
        const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
        const qFb=query(collection(window.firebaseDb,"feedbacks"), orderBy("timestamp","desc"));
        onSnapshot(qFb,(snap)=>renderTestimonials(snap.docs.map(d=>({...d.data(),id:d.id}))));
        const gallery=document.getElementById('achievements-gallery'); if(!gallery) return;
        const qAch=query(collection(window.firebaseDb,"achievements"), orderBy("timestamp","desc"));
        onSnapshot(qAch,(snap)=>renderMainAchievements(snap.docs.map(d=>({...d.data(),id:d.id}))));
    } else setTimeout(initializeFirebaseListeners,100);
}
initializeFirebaseListeners();

// --- You can keep your existing renderMainAchievements function for slider ---
