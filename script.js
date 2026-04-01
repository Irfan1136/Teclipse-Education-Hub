// --- Theme Management ---
const themeToggles = document.querySelectorAll('#theme-toggle, #theme-toggle-admin');
const htmlEl = document.documentElement;

function updateIcon(isDark) {
    document.querySelectorAll('#theme-icon, #theme-icon-admin').forEach(icon => {
        if (isDark) {
            icon.classList.remove('bx-moon');
            icon.classList.add('bx-sun');
        } else {
            icon.classList.remove('bx-sun');
            icon.classList.add('bx-moon');
        }
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
        if (prefersDark) {
            htmlEl.setAttribute('data-theme', 'dark');
            updateIcon(true);
        }
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


// --- Navbar Scroll & Mobile Menu ---
const navbar = document.getElementById('navbar');
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileSidebar = document.getElementById('mobile-sidebar');
const overlay = document.getElementById('sidebar-overlay');
const closeSidebar = document.getElementById('close-sidebar');

if (navbar) {
    // Debounced scroll handler to avoid jitter and repeated toggles
    let lastScroll = window.scrollY;
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const y = window.scrollY;
            if (y > 20 && !navbar.classList.contains('scrolled')) {
                navbar.classList.add('scrolled');
            } else if (y <= 20 && navbar.classList.contains('scrolled')) {
                navbar.classList.remove('scrolled');
            }
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
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 150;
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    // Handle being at the bottom of the page
    if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 50) {
        if (sections.length > 0) current = sections[sections.length - 1].getAttribute('id');
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (current && link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        } else if (!current && scrollY < 300) {
            if (link.getAttribute('href') === '#home') link.classList.add('active');
        }
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
    loginBtn.addEventListener('click', () => { loginModal.classList.add('show'); });
    mobileLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.add('show');
    });
    closeModal.addEventListener('click', () => { loginModal.classList.remove('show'); });
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.classList.remove('show');
    });
}

// Admin Login Form
const adminForm = document.getElementById('admin-login-form');
if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;

        // Use stored admin password in localStorage with a default fallback
        const storedPass = localStorage.getItem('teclipse_admin_password') || '2003@esai';
        if (email === 'teclipseeducationhub@gmail.com' && pass === storedPass) {
            localStorage.setItem('teclipse_admin_auth', 'true');
            window.location.href = 'admin.html';
        } else {
            alert("Invalid Email or Password. Please ensure you use the correct Admin credentials.");
        }
    });
}

// --- Star Rating ---
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating-value');

stars.forEach(star => {
    star.addEventListener('mouseover', function () { highlightStars(this.getAttribute('data-value')); });
    star.addEventListener('mouseout', function () { highlightStars(ratingInput.value || 0); });
    star.addEventListener('click', function () {
        const val = this.getAttribute('data-value');
        ratingInput.value = val;
        highlightStars(val);
    });
});

function highlightStars(value) {
    stars.forEach(star => {
        if (star.getAttribute('data-value') <= value) {
            star.classList.replace('bx-star', 'bxs-star');
            star.classList.add('active');
        } else {
            star.classList.replace('bxs-star', 'bx-star');
            star.classList.remove('active');
        }
    });
}

// --- Feedback Data management (Firebase) ---
async function fetchFeedbacks() {
    if (!window.firebaseDb) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;
    const q = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));

    onSnapshot(q, (querySnapshot) => {
        const feedbacks = [];
        querySnapshot.forEach((doc) => {
            feedbacks.push({ id: doc.id, ...doc.data() });
        });

        // Show all reviews on the main page
        renderTestimonials(feedbacks);
    });
}

// Feedback submission
const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
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

        // 1. Save to Firebase
        try {
            if (window.firebaseDb && window.firebaseModules) {
                const { collection, addDoc } = window.firebaseModules;
                await addDoc(collection(window.firebaseDb, "feedbacks"), {
                    name,
                    email,
                    rating,
                    message,
                    date: new Date().toLocaleDateString(),
                    timestamp: Date.now()
                });
                console.log("Feedback successfully written to Firestore!");
            } else {
                console.error("Firebase is not initialized yet. Cannot save feedback.");
                alert("Database connection is still loading. Please try again in a few seconds.");
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return; // Stop execution if DB is not ready
            }
        } catch (error) {
            console.error("Error saving feedback to database: ", error);
            alert("Failed to connect to the database. Please check your internet connection and try again.");
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            return; // Stop execution
        }

        // 2. Send Email via Brevo
        const emailContent = `
            <h2>New Student Feedback</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Rating:</strong> ${rating} Stars out of 5</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background:#f4f4f4; border-left:4px solid #1E3A8A; padding:10px;">${message}</blockquote>
            <br>
            <p>You can view all feedbacks by logging into the Teclipse Admin Dashboard.</p>
        `;

        const payload = {
            sender: {
                name: "Teclipse Feedback System",
                email: "teclipseeducationhub@gmail.com" // Update this if your verified Company Mail is different
            },
            to: [
                {
                    email: "esaiyazhini2020@gmail.com",
                    name: "Admin"
                }
            ],
            subject: `New Student Feedback: ${name}`,
            htmlContent: emailContent,
            replyTo: {
                email: email, // Directly reply to the Student's email
                name: name
            }
        };

        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': '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', /* SECURITY WARNING: Never hardcode API keys in frontend JS! */
                    'content-type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Thank you! Your feedback has been submitted successfully.');
            } else {
                const data = await response.json();
                console.warn("Email notification failed: ", data);
                // Still notify user it was saved to the database successfully
                alert('Thank you! Your feedback has been submitted successfully.');
            }

            feedbackForm.reset();
            ratingInput.value = '';
            highlightStars(0);

        } catch (error) {
            console.error('Error submitting feedback email:', error);
            alert('Thank you! Your feedback has been submitted successfully.');
            feedbackForm.reset();
            ratingInput.value = '';
            highlightStars(0);
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}


// --- Testimonial Slider (Auto & Manual) ---
let currentSlide = 0;
let slideElements = [];
let slideInterval;

function generateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= rating ? "<i class='bx bxs-star'></i>" : "<i class='bx bx-star'></i>";
    }
    return html;
}

function renderTestimonials(visibleFeedbacks = []) {
    const slider = document.getElementById('testimonial-slider');
    if (!slider) return;

    slider.innerHTML = '';
    if (visibleFeedbacks.length === 0) {
        slider.innerHTML = '<div class="empty-state">No reviews yet.</div>';
        return;
    }

    visibleFeedbacks.forEach((fb, index) => {
        const slide = document.createElement('div');
        slide.className = `testimonial-slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <div class="stars">${generateStars(fb.rating)}</div>
            <p class="review-text">"${fb.message}"</p>
            <h4 class="reviewer-name">- ${fb.name}</h4>
        `;
        slider.appendChild(slide);
    });

    slideElements = document.querySelectorAll('.testimonial-slide');
    currentSlide = 0;

    startAutoSlide();
}

function nextSlide() {
    if (slideElements.length <= 1) return;
    slideElements[currentSlide].classList.remove('active');
    currentSlide++;
    if (currentSlide >= slideElements.length) currentSlide = 0;
    slideElements[currentSlide].classList.add('active');
}

function prevSlide() {
    if (slideElements.length <= 1) return;
    slideElements[currentSlide].classList.remove('active');
    currentSlide--;
    if (currentSlide < 0) currentSlide = slideElements.length - 1;
    slideElements[currentSlide].classList.add('active');
}

function startAutoSlide() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3000);
}

if (document.getElementById('testimonial-slider')) {
    renderTestimonials();

    document.getElementById('next-btn').addEventListener('click', () => {
        nextSlide();
        startAutoSlide(); // reset timer on manual click
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
        prevSlide();
        startAutoSlide(); // reset timer on manual click
    });

    // Pause auto slide on hover
    const sliderContainer = document.querySelector('.testimonial-slider-container');
    sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
    sliderContainer.addEventListener('mouseleave', () => startAutoSlide());
}

// --- Main Page Achievements Rendering (Firebase) ---
let achievementSlideInterval;

function renderMainAchievements(achievements = []) {
    const gallery = document.getElementById('achievements-gallery');
    if (!gallery) return;

    if (achievements.length === 0) {
        gallery.innerHTML = '<div style="text-align: center; width: 100%; grid-column: 1 / -1; color: var(--text-muted);"><p>No achievements uploaded yet.</p></div>';
        return;
    }

    // Add required CSS dynamically if not present
    if (!document.getElementById('achievement-slider-style')) {
        const style = document.createElement('style');
        style.id = 'achievement-slider-style';
        style.textContent = `
            .achievements-slider-wrapper {
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
            }
            #achievements-gallery {
                display: flex;
                gap: 1.5rem;
                overflow-x: auto;
                padding: 2rem 50% 3rem 50%;
                scroll-snap-type: x mandatory;
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* IE/Edge */
                scroll-behavior: smooth;
                width: 100%;
            }
            #achievements-gallery::-webkit-scrollbar {
                display: none; /* Chrome/Safari */
            }
            .achievement-card {
                flex: 0 0 auto;
                width: 320px;
                scroll-snap-align: center;
                border-radius: var(--radius-lg);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
                transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                opacity: 0.6;
                transform: scale(0.85);
            }
            .achievement-card.active {
                opacity: 1;
                transform: scale(1.1);
                box-shadow: var(--shadow-lg);
                z-index: 10;
            }
            .achievement-card img {
                width: 100%;
                height: 250px;
                object-fit: contain;
                background-color: #000;
                display: block;
            }
            
            /* Buttons for achievements */
            .ach-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: var(--primary-color);
                color: #fff;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: var(--shadow-md);
                z-index: 20;
                transition: background 0.3s;
            }
            .ach-btn:hover { background: var(--accent-color); }
            .ach-btn.prev { left: 10px; }
            .ach-btn.next { right: 10px; }

            @media (max-width: 768px) {
                #achievements-gallery {
                    padding: 2rem 50% 3rem 50%;
                }
                .achievement-card {
                    width: 260px;
                }
                .achievement-card img {
                    height: 200px;
                }
                .ach-btn {
                    width: 35px;
                    height: 35px;
                    font-size: 1.2rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    let html = '';
    achievements.forEach((ach, index) => {
        html += `
            <div class="achievement-card" id="ach-card-${index}">
                <img src="${ach.url}" alt="${ach.title}" onerror="this.outerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#eee;color:#999;font-size:1.2rem;\\'>Image Error</div>';">
                <div style="padding: 1rem; background: var(--card-bg); text-align: center;">
                    <h4 style="font-size: 1.1rem; color: var(--text-main); margin: 0;">${ach.title}</h4>
                </div>
            </div>
        `;
    });

    gallery.innerHTML = html;

    // Add buttons dynamically if they don't exist
    let wrapper = gallery.parentElement;
    if (!wrapper.classList.contains('achievements-slider-wrapper')) {
        wrapper = document.createElement('div');
        wrapper.className = 'achievements-slider-wrapper';
        gallery.parentNode.insertBefore(wrapper, gallery);
        wrapper.appendChild(gallery);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'ach-btn prev';
        prevBtn.innerHTML = "<i class='bx bx-chevron-left'></i>";
        prevBtn.id = "ach-prev-btn";

        const nextBtn = document.createElement('button');
        nextBtn.className = 'ach-btn next';
        nextBtn.innerHTML = "<i class='bx bx-chevron-right'></i>";
        nextBtn.id = "ach-next-btn";

        wrapper.insertBefore(prevBtn, gallery);
        wrapper.appendChild(nextBtn);
    }

    // Scroll Logic
    const cards = document.querySelectorAll('.achievement-card');
    let currentIndex = 0; // State to track index directly
    let isGalleryVisible = false;

    // Check if gallery is actually on screen so we don't slide/jump when user is reading other sections
    const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isGalleryVisible = entry.isIntersecting;
        });
    }, { threshold: 0.1 }); // Only need 10% visibility to allow sliding
    visibilityObserver.observe(gallery);

    function scrollToCard(index) {
        if (cards.length === 0 || !cards[index]) return;

        // Calculate exact scroll left coordinate
        const card = cards[index];
        const scrollPosition = card.offsetLeft - (gallery.clientWidth / 2) + (card.clientWidth / 2);

        gallery.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    }

    function scrollNext() {
        if (cards.length === 0 || !isGalleryVisible) return;

        currentIndex++;
        if (currentIndex >= cards.length) {
            currentIndex = 0; // Loop back
        }
        scrollToCard(currentIndex);
    }

    function scrollPrev() {
        if (cards.length === 0) return;

        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = cards.length - 1; // Loop back to end
        }
        scrollToCard(currentIndex);
    }

    function startAchAutoSlide() {
        clearInterval(achievementSlideInterval);
        achievementSlideInterval = setInterval(scrollNext, 2500);
    }

    document.getElementById('ach-next-btn').onclick = () => {
        scrollNext();
        startAchAutoSlide();
    };

    document.getElementById('ach-prev-btn').onclick = () => {
        scrollPrev();
        startAchAutoSlide();
    };

    // Pause on hover
    wrapper.onmouseenter = () => clearInterval(achievementSlideInterval);
    wrapper.onmouseleave = () => startAchAutoSlide();


    // Observe Which Card is Centered (Only for applying CSS effects, NOT index math)
    setTimeout(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    cards.forEach(c => c.classList.remove('active'));
                    entry.target.classList.add('active');
                }
            });
        }, {
            root: gallery,
            threshold: 0.6
        });

        cards.forEach(card => observer.observe(card));

        if (cards.length > 0) {
            setTimeout(() => {
                scrollToCard(0);
                startAchAutoSlide(); // Start slide after initial center
            }, 100);
        }
    }, 100);
}

// Fetch Achievements from Firebase Listener
async function fetchAchievements() {
    if (!window.firebaseDb) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseModules;

    // Check if gallery exists on this page before querying
    if (!document.getElementById('achievements-gallery')) return;

    const q = query(collection(window.firebaseDb, "achievements"), orderBy("timestamp", "desc"));

    onSnapshot(q, (querySnapshot) => {
        const achievements = [];
        querySnapshot.forEach((doc) => {
            achievements.push({ id: doc.id, ...doc.data() });
        });
        renderMainAchievements(achievements);
    });
}

// Initialize listeners - retry until window.firebaseModules is ready
function initializeFirebaseListeners() {
    if (window.firebaseDb && window.firebaseModules) {
        fetchFeedbacks();
        fetchAchievements();
    } else {
        // Retry every 100ms until the module scripts load
        setTimeout(initializeFirebaseListeners, 100);
    }
}

initializeFirebaseListeners();
