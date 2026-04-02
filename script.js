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
    if (mobileSidebar) mobileSidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
if (closeSidebar) closeSidebar.addEventListener('click', toggleMenu);
if (overlay) overlay.addEventListener('click', toggleMenu);

document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileSidebar) mobileSidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
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
        if (loginModal) loginModal.classList.add('show');
    });
});

if (closeModal) closeModal.addEventListener('click', () => loginModal.classList.remove('show'));
window.addEventListener('click', e => {
    if (loginModal && e.target === loginModal) loginModal.classList.remove('show');
});

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
// --- ✅ Star Rating — Gold Color Fix ---
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

const starRatingContainer = document.getElementById('star-rating');
if (starRatingContainer) {
    starRatingContainer.style.cssText = 'display:flex; gap:6px; font-size:2rem; cursor:pointer; margin-top:4px;';
}

function highlightStars(value) {
    const numVal = parseInt(value) || 0;
    stars.forEach(star => {
        const starVal = parseInt(star.dataset.value);
        if (starVal <= numVal) {
            star.classList.remove('bx-star');
            star.classList.add('bxs-star');
            star.style.color = '#f5c518';
        } else {
            star.classList.remove('bxs-star');
            star.classList.add('bx-star');
            star.style.color = '#888';
        }
    });
}

stars.forEach(star => {
    star.style.transition = 'color 0.15s ease, transform 0.15s ease';
    star.addEventListener('mouseover', () => {
        highlightStars(star.dataset.value);
        star.style.transform = 'scale(1.2)';
    });
    star.addEventListener('mouseout', () => {
        highlightStars(ratingInput ? ratingInput.value : 0);
        star.style.transform = 'scale(1)';
    });
    star.addEventListener('click', () => {
        if (ratingInput) ratingInput.value = star.dataset.value;
        highlightStars(star.dataset.value);
    });
});

// ================================
// --- Testimonial Slider ---
let sliderIndex = 0;
let sliderInterval = null;

function initTestimonialSlider() {
    const slides = document.querySelectorAll('.testimonial-slide');
    if (!slides.length) return;

    sliderIndex = 0;
    if (sliderInterval) clearInterval(sliderInterval);

    function showSlide(index) {
        slides.forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
        });
        slides[index].style.display = 'block';
        slides[index].classList.add('active');
    }

    showSlide(sliderIndex);

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

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
// --- ✅ FIX: Render Achievements ---
// admin.js saves image as `url` field — renderMainAchievements must read `ach.url`
// Also builds mobile horizontal scroll slider with prev/next buttons
function renderMainAchievements(achievements) {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    if (!achievements || achievements.length === 0) {
        gallery.style.display = 'block';
        gallery.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:2rem 0;">No achievements uploaded yet.</p>`;
        return;
    }

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // ── Mobile: horizontal scroll slider with Prev / Next buttons ──
        gallery.style.cssText = 'position:relative; width:100%; padding: 0 0 1rem 0; box-sizing:border-box;';

        // Scroll track
        const track = document.createElement('div');
        track.id = 'ach-track';
        track.style.cssText = `
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            scroll-behavior: smooth;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 0.5rem 1rem 1rem;
        `;
        track.style.setProperty('-webkit-overflow-scrolling', 'touch');

        // Hide native scrollbar via inline style trick
        const styleTag = document.getElementById('ach-scroll-style') || document.createElement('style');
        styleTag.id = 'ach-scroll-style';
        styleTag.textContent = '#ach-track::-webkit-scrollbar { display: none; }';
        document.head.appendChild(styleTag);

        achievements.forEach(a => {
            const imgSrc = a.url || a.image || a.imageUrl || a.imageData || '';
            const caption = a.title || a.caption || '';
            const card = document.createElement('div');
            card.style.cssText = `
                min-width: 220px;
                max-width: 220px;
                flex-shrink: 0;
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                text-align: center;
                padding-bottom: 0.75rem;
            `;
            card.innerHTML = `
                <img src="${imgSrc}" alt="${caption}"
                    style="width:100%;height:160px;object-fit:cover;display:block;"
                    onerror="this.style.display='none';">
                <h4 style="margin:0.6rem 0.5rem 0;color:var(--text-main,#fff);font-size:0.85rem;font-weight:600;">${caption}</h4>
            `;
            track.appendChild(card);
        });

        // Prev button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = `<i class='bx bx-chevron-left'></i>`;
        prevBtn.style.cssText = `
            position:absolute; left:4px; top:50%; transform:translateY(-60%);
            z-index:10; background:var(--primary-color,#1e3a8a); color:#fff;
            border:none; border-radius:50%; width:36px; height:36px;
            font-size:1.3rem; cursor:pointer; display:flex;
            align-items:center; justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
        `;
        prevBtn.addEventListener('click', () => { track.scrollBy({ left: -240, behavior: 'smooth' }); });

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = `<i class='bx bx-chevron-right'></i>`;
        nextBtn.style.cssText = `
            position:absolute; right:4px; top:50%; transform:translateY(-60%);
            z-index:10; background:var(--primary-color,#1e3a8a); color:#fff;
            border:none; border-radius:50%; width:36px; height:36px;
            font-size:1.3rem; cursor:pointer; display:flex;
            align-items:center; justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
        `;
        nextBtn.addEventListener('click', () => { track.scrollBy({ left: 240, behavior: 'smooth' }); });

        gallery.appendChild(prevBtn);
        gallery.appendChild(track);
        gallery.appendChild(nextBtn);

    } else {
        // ── Desktop: grid layout ──
        gallery.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1.5rem;
            padding: 1rem;
            width: 100%;
            box-sizing: border-box;
        `;

        achievements.forEach(a => {
            // ✅ admin.js stores image as `url` — this is the correct field
            const imgSrc = a.url || a.image || a.imageUrl || a.imageData || '';
            const caption = a.title || a.caption || '';

            const div = document.createElement('div');
            div.classList.add('achievement-card');
            div.style.cssText = `
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                overflow: hidden;
                text-align: center;
                padding-bottom: 1rem;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            `;
            div.innerHTML = `
                <img src="${imgSrc}" alt="${caption}"
                    style="width:100%;height:200px;object-fit:cover;display:block;"
                    onerror="this.style.display='none';">
                <h4 style="margin:0.75rem 0.75rem 0.25rem;color:var(--text-main,#fff);
                           font-size:0.95rem;font-weight:600;line-height:1.4;">${caption}</h4>
            `;
            div.addEventListener('mouseenter', () => {
                div.style.transform = 'translateY(-6px)';
                div.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
            });
            div.addEventListener('mouseleave', () => {
                div.style.transform = 'translateY(0)';
                div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            });
            gallery.appendChild(div);
        });
    }
}

// Re-render achievements on resize so mobile/desktop layout switches correctly
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window._lastAchievements) renderMainAchievements(window._lastAchievements);
    }, 300);
});

// ================================
// --- Render Testimonials ---
function renderTestimonials(feedbacks) {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;
    slider.innerHTML = '';

    if (!feedbacks || feedbacks.length === 0) {
        const empty = document.createElement('div');
        empty.classList.add('testimonial-slide');
        empty.style.cssText = 'text-align:center;padding:2rem;color:#aaa;';
        empty.innerHTML = '<p>No reviews yet. Be the first to share your experience!</p>';
        slider.appendChild(empty);
    } else {
        feedbacks.forEach(f => {
            const div = document.createElement('div');
            div.classList.add('testimonial-slide');
            const rating = parseInt(f.rating) || 0;
            const filledStars = '★'.repeat(rating);
            const emptyStars  = '☆'.repeat(5 - rating);
            div.innerHTML = `
                <p style="font-size:1.05rem;line-height:1.7;color:var(--text-muted,#ccc);font-style:italic;">
                    "${f.message}"
                </p>
                <h4 style="margin-top:1rem;font-weight:700;color:var(--text-main,#fff);">
                    ${f.name}
                </h4>
                <span style="color:#f5c518;font-size:1.3rem;letter-spacing:2px;">
                    ${filledStars}<span style="color:#555;">${emptyStars}</span>
                </span>
            `;
            slider.appendChild(div);
        });
    }

    initTestimonialSlider();
}

// ================================
// --- ✅ FIX: Fetch Firebase Data ---
// Uses onSnapshot for real-time updates
async function fetchFeedbacks() {
    if (!window.firebaseDb || !window.firebaseModules) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
    try {
        const q = query(collection(window.firebaseDb, 'feedbacks'), orderBy('timestamp', 'desc'));
        onSnapshot(q, snapshot => {
            const feedbacks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            renderTestimonials(feedbacks);
        }, err => {
            console.error('Feedbacks listener error:', err);
            renderTestimonials([]);
        });
    } catch (err) {
        console.error('fetchFeedbacks error:', err);
        renderTestimonials([]);
    }
}

async function fetchAchievements() {
    if (!window.firebaseDb || !window.firebaseModules) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
    try {
        const q = query(collection(window.firebaseDb, 'achievements'), orderBy('timestamp', 'desc'));
        onSnapshot(q, snapshot => {
            const achievements = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Store globally so resize handler can re-render
            window._lastAchievements = achievements;
            renderMainAchievements(achievements);
        }, err => {
            console.error('Achievements listener error:', err);
            renderMainAchievements([]);
        });
    } catch (err) {
        console.error('fetchAchievements error:', err);
        renderMainAchievements([]);
    }
}

// ================================
// --- Feedback Form Submit ---
const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!window.firebaseDb) return alert('Firebase not initialized!');
        const { collection, addDoc } = window.firebaseModules;

        const ratingVal = parseInt(ratingInput ? ratingInput.value : 0) || 0;
        if (ratingVal === 0) {
            alert('Please select a star rating before submitting.');
            return;
        }

        try {
            await addDoc(collection(window.firebaseDb, 'feedbacks'), {
                name:      document.getElementById('name').value,
                email:     document.getElementById('email').value,
                message:   document.getElementById('message').value,
                rating:    ratingVal,
                timestamp: new Date()
            });

            feedbackForm.reset();
            if (ratingInput) ratingInput.value = 0;
            highlightStars(0);
            alert('Feedback submitted successfully! Thank you.');
        } catch (err) {
            console.error('Feedback submit error:', err);
            alert('Failed to submit feedback. Try again later.');
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
