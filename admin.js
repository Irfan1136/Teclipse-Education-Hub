// ======================= Theme & Logout =======================
const themeToggleAdmin = document.getElementById('theme-toggle-admin');
const themeIconAdmin = document.getElementById('theme-icon-admin');
const htmlElAdmin = document.documentElement;

function updateIconAdmin(isDark) {
    if (isDark) {
        themeIconAdmin.classList.remove('bx-moon');
        themeIconAdmin.classList.add('bx-sun');
    } else {
        themeIconAdmin.classList.remove('bx-sun');
        themeIconAdmin.classList.add('bx-moon');
    }
}

const savedTheme = localStorage.getItem('teclipse-theme') || 'light';
htmlElAdmin.setAttribute('data-theme', savedTheme);
updateIconAdmin(savedTheme === 'dark');

themeToggleAdmin.addEventListener('click', () => {
    const currentTheme = htmlElAdmin.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElAdmin.setAttribute('data-theme', newTheme);
    localStorage.setItem('teclipse-theme', newTheme);
    updateIconAdmin(newTheme === 'dark');
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('teclipse_admin_auth'); // only auth token
    window.location.href = 'index.html';
});

// ======================= Firebase Feedback & Achievements =======================
const feedbackList = document.getElementById('admin-feedback-list');
const cardsContainer = document.getElementById('admin-feedback-cards');
const adminAchievementsList = document.getElementById('admin-achievements-list');

function generateAdminStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= rating ? "<i class='bx bxs-star' style='color:#FBBF24'></i>" : "<i class='bx bx-star' style='color:#ccc'></i>";
    }
    return html;
}

// Render feedbacks
function renderAdminFeedbacks(feedbacks) {
    feedbackList.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';

    if (feedbacks.length === 0) {
        feedbackList.innerHTML = '<tr><td colspan="6" class="empty-state">No student feedback found.</td></tr>';
        if (cardsContainer) cardsContainer.innerHTML = '<div class="empty-state">No student feedback found.</div>';
        return;
    }

    feedbacks.forEach(fb => {
        // Table row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="white-space: nowrap; color: var(--text-muted);">${fb.date}</td>
            <td style="font-weight: 500;">${fb.name}</td>
            <td><a href="mailto:${fb.email}" style="color: var(--primary-color);">${fb.email}</a></td>
            <td>${generateAdminStars(fb.rating)}</td>
            <td style="max-width: 300px;">${fb.message}</td>
            <td style="text-align: right;">
                <button class="btn-danger" onclick="deleteFeedback('${fb.id}')" aria-label="Delete">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        feedbackList.appendChild(tr);

        // Mobile card
        if (cardsContainer) {
            const card = document.createElement('div');
            card.className = 'admin-feedback-card';
            card.innerHTML = `
                <div class="card-head">
                    <div class="card-name">${fb.name}</div>
                    <div class="card-date">${fb.date}</div>
                </div>
                <div class="card-body">
                    <div class="card-email"><a href="mailto:${fb.email}">${fb.email}</a></div>
                    <div class="card-rating">${generateAdminStars(fb.rating)}</div>
                    <div class="card-message">${fb.message}</div>
                </div>
                <div class="card-actions">
                    <button class="btn-danger" onclick="deleteFeedback('${fb.id}')" aria-label="Delete"><i class='bx bx-trash'></i></button>
                </div>
            `;
            cardsContainer.appendChild(card);
        }
    });

    // Toggle table vs cards
    function toggleFeedbackView() {
        const showCards = window.innerWidth <= 700;
        if (cardsContainer) cardsContainer.style.display = showCards ? 'block' : 'none';
        const tableEl = document.querySelector('.feedback-table');
        if (tableEl) tableEl.style.display = showCards ? 'none' : 'table';
    }
    toggleFeedbackView();
    window.addEventListener('resize', toggleFeedbackView);
}

window.deleteFeedback = async function (id) {
    if (!window.firebaseDb) return;
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    const { doc, deleteDoc } = window.firebaseModules;
    try { await deleteDoc(doc(window.firebaseDb, 'feedbacks', id)); }
    catch (err) { console.error(err); alert('Error deleting feedback'); }
}

// Render Achievements
function renderAdminAchievements(achievements) {
    if (achievements.length === 0) {
        adminAchievementsList.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No achievements uploaded yet.</p>';
        return;
    }

    let html = '';
    achievements.forEach(ach => {
        html += `
            <div style="border:1px solid var(--border-color); border-radius:var(--radius-md); overflow:hidden; background:var(--bg-secondary);">
                <img src="${ach.url}" alt="${ach.title}" style="width:100%; height:150px; object-fit:contain; background:#000;" onerror="this.style.display='none'; this.nextElementSibling.insertAdjacentHTML('afterbegin', '<div style=\\'height:150px;display:flex;align-items:center;justify-content:center;background:#eee;color:#999;\\'>Image Error</div>');">
                <div style="padding:0.75rem;">
                    <p style="font-size:0.9rem; font-weight:500; margin-bottom:0.5rem; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${ach.title}</p>
                    <button class="btn btn-outline" style="padding:0.25rem 0.5rem; font-size:0.8rem; width:100%;" onclick="deleteAchievement('${ach.id}')">Delete</button>
                </div>
            </div>
        `;
    });
    adminAchievementsList.innerHTML = html;
}

window.deleteAchievement = async function (id) {
    if (!window.firebaseDb) return;
    if (!confirm('Remove this achievement photo?')) return;
    const { doc, deleteDoc } = window.firebaseModules;
    try { await deleteDoc(doc(window.firebaseDb, 'achievements', id)); }
    catch (err) { console.error(err); alert('Error deleting achievement'); }
}

// Initialize Firebase listeners
function initializeAdminFirebase() {
    if (!window.firebaseDb || !window.firebaseModules || !adminAchievementsList) return setTimeout(initializeAdminFirebase, 100);

    const { collection, onSnapshot, query, orderBy, limit } = window.firebaseModules;

    // Feedback
    const qF = query(collection(window.firebaseDb, 'feedbacks'), orderBy('timestamp', 'desc'), limit(50));
    onSnapshot(qF, snapshot => {
        const feedbacks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAdminFeedbacks(feedbacks);
    });

    // Achievements
    const qA = query(collection(window.firebaseDb, 'achievements'), orderBy('timestamp', 'desc'));
    onSnapshot(qA, snapshot => {
        const achievements = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAdminAchievements(achievements);
    });
}

initializeAdminFirebase();

// ======================= Change Password =======================
const changePassBtn = document.getElementById('change-pass-btn');
const changePassModal = document.getElementById('change-pass-modal');
const closeChangePass = document.getElementById('close-change-pass');
const changePassForm = document.getElementById('change-pass-form');

if (changePassBtn && changePassModal) changePassBtn.addEventListener('click', () => changePassModal.classList.add('show'));
if (closeChangePass && changePassModal) closeChangePass.addEventListener('click', () => changePassModal.classList.remove('show'));
window.addEventListener('click', e => { if (e.target === changePassModal) changePassModal.classList.remove('show'); });

if (changePassForm) {
    changePassForm.addEventListener('submit', async e => {
        e.preventDefault();
        const oldPass = document.getElementById('old-pass').value;
        const newPass = document.getElementById('new-pass').value;
        const confirmPass = document.getElementById('confirm-pass').value;

        if (newPass !== confirmPass) return alert('New passwords do not match');
        const valid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPass);
        if (!valid) return alert('Password must be 8+ chars with letters, numbers & special char');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'changePass', oldPass, newPass })
            });
            const data = await res.json();
            if (!res.ok) return alert(data.error || 'Failed to change password');
            alert(data.message || 'Password change success (update env manually for full effect)');
            changePassForm.reset();
            changePassModal.classList.remove('show');
        } catch (err) { console.error(err); alert('Server error, try again later'); }
    });
}
