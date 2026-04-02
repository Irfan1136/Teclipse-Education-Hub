// ================================
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
            alert("Invalid Email or Password.");
        }
    });
}

// ================================
// --- Star Rating ---
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
// --- Testimonial Slider State ---
let sliderIndex = 0;
let sliderInterval = null;

function initTestimonialSlider() {
    const slides = document.querySelectorAll('.testimonial-slide');
    if (!slides.length) return;

    // Reset index safely
    sliderIndex = 0;

    // Clear any previous auto-play interval
    if (sliderInterval) clearInterval(sliderInterval);

    function showSlide(index) {
        slides.forEach((s, i) => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        slides[index].classList.add('active');
        slides[index].style.display = 'block';
    }

    showSlide(sliderIndex);

    // Prev Button
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Remove old listeners by cloning buttons
    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', () => {
            sliderIndex = (sliderIndex - 1 + slides.length) % slides.length;
            showSlide(sliderIndex);
            resetAutoPlay();
        });
    }

    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', () => {
            sliderIndex = (sliderIndex + 1) % slides.length;
            showSlide(sliderIndex);
            resetAutoPlay();
        });
    }

    // Auto play every 4 seconds
    function startAutoPlay() {
        sliderInterval = setInterval(() => {
            sliderIndex = (sliderIndex + 1) % slides.length;
            showSlide(sliderIndex);
        }, 4000);
    }

    function resetAutoPlay() {
        if (sliderInterval) clearInterval(sliderInterval);
        startAutoPlay();
    }

    startAutoPlay();
}

// ================================
// --- Firebase Render Functions ---

// ✅ FIX: Achievements rendered as a LEFT-TO-RIGHT GRID
function renderMainAchievements(achievements) {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    // Apply grid layout directly via inline style as a fallback guarantee
    gallery.style.display = 'grid';
    gallery.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
    gallery.style.gap = '1.5rem';
    gallery.style.padding = '2rem 1rem';
    gallery.style.width = '100%';
    gallery.style.boxSizing = 'border-box';

    if (achievements.length === 0) {
        gallery.innerHTML = '<p style="color:#aaa; text-align:center; grid-column:1/-1;">No achievements added yet.</p>';
        return;
    }

    achievements.forEach(a => {
        const div = document.createElement('div');
        div.classList.add('achievement-card');

        // Inline style ensures card always looks correct regardless of external CSS
        div.style.cssText = `
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            overflow: hidden;
            text-align: center;
            padding-bottom: 1rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
        `;

        div.innerHTML = `
            <img 
                src="${a.image}" 
                alt="${a.caption || 'Achievement'}"
                onerror="this.onerror=null; this.src='https://placehold.co/300x200/1a2a4a/ffffff?text=Achievement';"
                style="width:100%; height:180px; object-fit:cover; display:block;"
            >
            <h4 style="
                margin: 0.75rem 0.5rem 0.25rem;
                color: #fff;
                font-size: 0.95rem;
                font-weight: 600;
            ">${a.caption || ''}</h4>
        `;

        // Hover effect
        div.addEventListener('mouseenter', () => {
            div.style.transform = 'translateY(-5px)';
            div.style.boxShadow = '0 8px 25px rgba(0,0,0,0.35)';
        });
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'translateY(0)';
            div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        });

        gallery.appendChild(div);
    });
}

// ✅ FIX: Testimonials rendered then slider initialized after
function renderTestimonials(feedbacks) {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;
    slider.innerHTML = '';

    if (feedbacks.length === 0) {
        const empty = document.createElement('div');
        empty.classList.add('testimonial-slide');
        empty.style.cssText = 'text-align:center; padding: 2rem; color: #aaa;';
        empty.innerHTML = '<p>No reviews yet. Be the first to share your experience!</p>';
        slider.appendChild(empty);
    } else {
        feedbacks.forEach(f => {
            const div = document.createElement('div');
            div.classList.add('testimonial-slide');

            // Generate star display
            const rating = parseInt(f.rating) || 0;
            const filledStars = '★'.repeat(rating);
            const emptyStars = '☆'.repeat(5 - rating);

            div.innerHTML = `
                <p style="font-size:1.05rem; line-height:1.7; color:#ccc; font-style:italic;">"${f.message}"</p>
                <h4 style="margin-top:1rem; font-weight:700; color:#fff;">${f.name}</h4>
                <span class="rating" style="color:#f5c518; font-size:1.2rem;">${filledStars}<span style="color:#555;">${emptyStars}</span></span>
            `;

            slider.appendChild(div);
        });
    }

    // ✅ KEY FIX: Initialize slider AFTER slides are injected into DOM
    initTestimonialSlider();
}

// ================================
// --- Fetch Firebase Data ---
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
    const q = query(collection(window.firebaseDb, "achievements"), orderBy("timestamp", "desc"));
    onSnapshot(q, snapshot => {
        const achievements = [];
        snapshot.forEach(doc => achievements.push({ id: doc.id, ...doc.data() }));
        renderMainAchievements(achievements);
    });
}

// ================================
// --- Feedback Form Submit ---
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
                rating: parseInt(document.getElementById('rating-value').value) || 0,
                timestamp: new Date()
            });
            feedbackForm.reset();
            if (ratingInput) {
                ratingInput.value = 0;
                highlightStars(0);
            }
            alert("Feedback submitted successfully!");
        } catch (err) {
            console.error("Feedback error:", err);
            alert("Failed to submit feedback. Try again later.");
        }
    });
}

// ================================
// --- Initialize Firebase Listeners ---
function initializeFirebaseListeners() {
    if (window.firebaseDb && window.firebaseModules) {
        fetchFeedbacks();
        fetchAchievements();
    } else {
        setTimeout(initializeFirebaseListeners, 100);
    }
}
initializeFirebaseListeners();
