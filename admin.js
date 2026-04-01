// admin.js — Teclipse Admin Panel

/* ── Auth Guard ── */
if (!localStorage.getItem('teclipse_admin_auth')) {
    window.location.href = 'index.html';
}

/* ── Toast ── */
function showToast(message, type = "info") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position:fixed;top:20px;right:20px;z-index:99999;
            display:flex;flex-direction:column;gap:10px;pointer-events:none;`;
        document.body.appendChild(container);
    }
    const colors = { success:'#22c55e', error:'#ef4444', info:'#3b82f6', warning:'#f59e0b' };
    const icons  = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    const toast  = document.createElement('div');
    toast.style.cssText = `
        background:${colors[type]||colors.info};color:#fff;
        padding:12px 18px;border-radius:10px;font-size:14px;font-weight:500;
        box-shadow:0 6px 20px rgba(0,0,0,.25);
        opacity:0;transform:translateX(60px);
        transition:all .35s cubic-bezier(.34,1.56,.64,1);
        max-width:340px;pointer-events:auto;
        display:flex;align-items:center;gap:8px;`;
    toast.innerHTML = `<span>${icons[type]||''}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity='1'; toast.style.transform='translateX(0)'; });
    setTimeout(() => {
        toast.style.opacity='0'; toast.style.transform='translateX(60px)';
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

/* ── Theme ── */
const themeToggleAdmin = document.getElementById('theme-toggle-admin');
const themeIconAdmin   = document.getElementById('theme-icon-admin');
const htmlElAdmin      = document.documentElement;

function updateIconAdmin(isDark) {
    if (!themeIconAdmin) return;
    themeIconAdmin.classList.toggle('bx-sun',  isDark);
    themeIconAdmin.classList.toggle('bx-moon', !isDark);
}

const savedTheme = localStorage.getItem('teclipse-theme') || 'light';
htmlElAdmin.setAttribute('data-theme', savedTheme);
updateIconAdmin(savedTheme === 'dark');

themeToggleAdmin?.addEventListener('click', () => {
    const newTheme = htmlElAdmin.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    htmlElAdmin.setAttribute('data-theme', newTheme);
    localStorage.setItem('teclipse-theme', newTheme);
    updateIconAdmin(newTheme === 'dark');
});

/* ── Logout ── */
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('teclipse_admin_auth');
    window.location.href = 'index.html';
});

/* ── Helpers ── */
function generateAdminStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= rating
            ? "<i class='bx bxs-star' style='color:#FBBF24'></i>"
            : "<i class='bx bx-star'  style='color:#ccc'></i>";
    }
    return html;
}

// FIX: Firestore stores `timestamp` as a number — `fb.date` never existed
function formatDate(ts) {
    if (!ts) return '—';
    try {
        return new Date(ts).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch { return '—'; }
}

/* ── DOM refs ── */
const feedbackList          = document.getElementById('admin-feedback-list');
const cardsContainer        = document.getElementById('admin-feedback-cards');
const adminAchievementsList = document.getElementById('admin-achievements-list');

/* ── Render Feedbacks ── */
function renderAdminFeedbacks(feedbacks) {
    if (!feedbackList) return;
    feedbackList.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';

    if (!feedbacks.length) {
        feedbackList.innerHTML = '<tr><td colspan="6" class="empty-state">No student feedback found.</td></tr>';
        if (cardsContainer) cardsContainer.innerHTML = '<div class="empty-state">No student feedback found.</div>';
        return;
    }

    feedbacks.forEach(fb => {
        const dateStr = formatDate(fb.timestamp);

        /* Table row */
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="white-space:nowrap;color:var(--text-muted);">${dateStr}</td>
            <td style="font-weight:500;">${fb.name||'—'}</td>
            <td><a href="mailto:${fb.email||''}" style="color:var(--primary-color);">${fb.email||'—'}</a></td>
            <td>${generateAdminStars(fb.rating||0)}</td>
            <td style="max-width:300px;">${fb.message||'—'}</td>
            <td style="text-align:right;">
                <button class="btn-danger" onclick="deleteFeedback('${fb.id}')" aria-label="Delete">
                    <i class='bx bx-trash'></i>
                </button>
            </td>`;
        feedbackList.appendChild(tr);

        /* Mobile card */
        if (cardsContainer) {
            const card = document.createElement('div');
            card.className = 'admin-feedback-card';
            card.innerHTML = `
                <div class="card-head">
                    <div class="card-name">${fb.name||'—'}</div>
                    <div class="card-date">${dateStr}</div>
                </div>
                <div class="card-body">
                    <div class="card-email"><a href="mailto:${fb.email||''}">${fb.email||'—'}</a></div>
                    <div class="card-rating">${generateAdminStars(fb.rating||0)}</div>
                    <div class="card-message">${fb.message||'—'}</div>
                </div>
                <div class="card-actions">
                    <button class="btn-danger" onclick="deleteFeedback('${fb.id}')" aria-label="Delete">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>`;
            cardsContainer.appendChild(card);
        }
    });

    toggleFeedbackView();
}

function toggleFeedbackView() {
    const showCards = window.innerWidth <= 700;
    if (cardsContainer) cardsContainer.style.display = showCards ? 'block' : 'none';
    const tableEl = document.querySelector('.feedback-table');
    if (tableEl) tableEl.style.display = showCards ? 'none' : 'table';
}
window.addEventListener('resize', toggleFeedbackView);

window.deleteFeedback = async function(id) {
    if (!window.firebaseDb) return;
    if (!confirm('Delete this feedback?')) return;
    const { doc, deleteDoc } = window.firebaseModules;
    try {
        await deleteDoc(doc(window.firebaseDb, 'feedbacks', id));
        showToast("Feedback deleted", "success");
    } catch (err) {
        console.error(err);
        showToast("Error deleting feedback", "error");
    }
};

/* ── Render Achievements ── */
function renderAdminAchievements(achievements) {
    if (!adminAchievementsList) return;
    if (!achievements.length) {
        adminAchievementsList.innerHTML =
            '<p style="color:var(--text-muted);grid-column:1/-1;">No achievements uploaded yet.</p>';
        return;
    }
    adminAchievementsList.innerHTML = achievements.map(ach => `
        <div style="border:1px solid var(--border-color);border-radius:var(--radius-md);
                    overflow:hidden;background:var(--bg-secondary);">
            <img src="${ach.url||ach.image||ach.imageUrl||''}" alt="${ach.title||''}"
                 style="width:100%;height:150px;object-fit:contain;background:#000;"
                 onerror="this.style.display='none';">
            <div style="padding:.75rem;">
                <p style="font-size:.9rem;font-weight:500;margin-bottom:.5rem;
                           overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${ach.title||'Untitled'}
                </p>
                <button class="btn btn-outline"
                        style="padding:.25rem .5rem;font-size:.8rem;width:100%;"
                        onclick="deleteAchievement('${ach.id}')">Delete</button>
            </div>
        </div>`).join('');
}

window.deleteAchievement = async function(id) {
    if (!window.firebaseDb) return;
    if (!confirm('Remove this achievement?')) return;
    const { doc, deleteDoc } = window.firebaseModules;
    try {
        await deleteDoc(doc(window.firebaseDb, 'achievements', id));
        showToast("Achievement removed", "success");
    } catch (err) {
        console.error(err);
        showToast("Error deleting achievement", "error");
    }
};

/* ── Firebase Init (polling) ── */
function initializeAdminFirebase() {
    if (!window.firebaseDb || !window.firebaseModules) {
        return setTimeout(initializeAdminFirebase, 100);
    }
    const { collection, onSnapshot, query, orderBy, limit } = window.firebaseModules;

    onSnapshot(
        query(collection(window.firebaseDb, 'feedbacks'), orderBy('timestamp','desc'), limit(50)),
        snap => renderAdminFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err  => { console.error(err); showToast("Failed to load feedbacks", "error"); }
    );

    onSnapshot(
        query(collection(window.firebaseDb, 'achievements'), orderBy('timestamp','desc')),
        snap => renderAdminAchievements(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err  => { console.error(err); showToast("Failed to load achievements", "error"); }
    );
}
initializeAdminFirebase();

/* ── Change Password Modal ── */
const changePassBtn   = document.getElementById('change-pass-btn');
const changePassModal = document.getElementById('change-pass-modal');
const closeChangePass = document.getElementById('close-change-pass');
const changePassForm  = document.getElementById('change-pass-form');

changePassBtn?.addEventListener('click',   () => changePassModal?.classList.add('show'));
closeChangePass?.addEventListener('click', () => changePassModal?.classList.remove('show'));
window.addEventListener('click', e => { if (e.target === changePassModal) changePassModal?.classList.remove('show'); });

if (changePassForm) {
    changePassForm.addEventListener('submit', async e => {
        e.preventDefault();
        const oldPass     = document.getElementById('old-pass').value;
        const newPass     = document.getElementById('new-pass').value;
        const confirmPass = document.getElementById('confirm-pass').value;

        if (newPass !== confirmPass) { showToast("Passwords do not match", "warning"); return; }

        const valid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPass);
        if (!valid) { showToast("Password needs 8+ chars, letters, numbers & special char", "warning"); return; }

        const submitBtn = changePassForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Updating…"; }

        try {
            const VERCEL_API = "https://teclipse-weld.vercel.app";
            const res  = await fetch(`${VERCEL_API}/api/adminlogin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'changePass', oldPass, newPass })
            });
            const data = await res.json();
            showToast(data.message || "Update your ADMIN_PASSWORD in Vercel dashboard", "info");
            changePassForm.reset();
            changePassModal?.classList.remove('show');
        } catch (err) {
            console.error(err);
            showToast("Server error. Try again.", "error");
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Update Password"; }
        }
    });
}
