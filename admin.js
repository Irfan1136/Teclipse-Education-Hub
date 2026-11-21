// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- auth guard (real Firebase login) ----------
const ADMIN_UIDS = ['tYDiSywtdAOK6cKRWaxKvEwYOjw1', 'DhttkMCqVwNvFkk6qzt4h7yCE4g2'];

(function guardAdmin() {
  const t = setInterval(() => {
    if (!window.firebaseAuth || !window.firebaseAuthModules) return;
    clearInterval(t);
    window.firebaseAuthModules.onAuthStateChanged(window.firebaseAuth, async user => {
      if (!user || !ADMIN_UIDS.includes(user.uid)) {
        if (user) { try { await window.firebaseAuthModules.signOut(window.firebaseAuth); } catch (e) { } }
        window.location.replace('index.html');
        return;
      }
      document.body.style.visibility = 'visible';
      initializeAdminFirebase();
    });
  }, 50);
})();

// ---------- theme sync ----------
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

// ---------- logout ----------
document.getElementById('logout-btn').addEventListener('click', async () => {
  try { await window.firebaseAuthModules.signOut(window.firebaseAuth); } catch (e) { }
  window.location.href = 'index.html';
});

// ---------- feedback management ----------
const feedbackList = document.getElementById('admin-feedback-list');
let contactMap = {};
let contactsError = false;
let lastFeedbacks = [];

function generateAdminStars(rating) {
  const r = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= r
      ? "<i class='bx bxs-star' style='color:#FBBF24'></i>"
      : "<i class='bx bx-star' style='color:#ccc'></i>";
  }
  return html;
}

function withEmail(list) {
  return list.map(f => ({ ...f, email: f.email || contactMap[f.id] || '' }));
}

function toggleFeedbackView() {
  const cardsContainer = document.getElementById('admin-feedback-cards');
  const showCards = window.innerWidth <= 700;
  if (cardsContainer) cardsContainer.style.display = showCards ? 'block' : 'none';
  const tableEl = document.querySelector('.feedback-table');
  if (tableEl) tableEl.style.display = showCards ? 'none' : 'table';
}
window.addEventListener('resize', toggleFeedbackView);

function renderAdminFeedbacks(feedbacks) {
  feedbackList.innerHTML = '';
  const cardsContainer = document.getElementById('admin-feedback-cards');
  if (cardsContainer) cardsContainer.innerHTML = '';

  if (feedbacks.length === 0) {
    feedbackList.innerHTML = '<tr><td colspan="6" class="empty-state">No student feedback found.</td></tr>';
    if (cardsContainer) cardsContainer.innerHTML = '<div class="empty-state">No student feedback found.</div>';
    return;
  }

  feedbacks.forEach((fb) => {
    const id = esc(fb.id);
    const mail = esc(fb.email);
    const emailHtml = mail
      ? `<a href="mailto:${mail}" style="color: var(--primary-color);">${mail}</a>`
      : (contactsError
        ? '<span title="Admin cannot read contacts: check Firestore rules and admin UID">Unavailable</span>'
        : '<span style="color: var(--text-muted);">Not saved</span>');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="white-space: nowrap; color: var(--text-muted);">${esc(fb.date)}</td>
      <td style="font-weight: 500;">${esc(fb.name)}</td>
      <td>${emailHtml}</td>
      <td>${generateAdminStars(fb.rating)}</td>
      <td style="max-width: 300px; white-space: pre-wrap; overflow-wrap: anywhere;">${esc(fb.message)}</td>
      <td style="text-align: right;">
        <button class="btn-danger" onclick="deleteFeedback('${id}')" aria-label="Delete">
          <i class='bx bx-trash'></i>
        </button>
      </td>
    `;
    feedbackList.appendChild(tr);

    if (cardsContainer) {
      const card = document.createElement('div');
      card.className = 'admin-feedback-card';
      card.innerHTML = `
        <div class="card-head">
          <div class="card-name">${esc(fb.name)}</div>
          <div class="card-date">${esc(fb.date)}</div>
        </div>
        <div class="card-body">
          <div class="card-email">${emailHtml}</div>
          <div class="card-rating">${generateAdminStars(fb.rating)}</div>
          <div class="card-message" style="white-space: pre-wrap; overflow-wrap: anywhere;">${esc(fb.message)}</div>
        </div>
        <div class="card-actions">
          <button class="btn-danger" onclick="deleteFeedback('${id}')" aria-label="Delete"><i class='bx bx-trash'></i></button>
        </div>
      `;
      cardsContainer.appendChild(card);
    }
  });

  toggleFeedbackView();
}

window.deleteFeedback = async function (id) {
  if (!confirm("Are you sure you want to delete this feedback review?")) return;
  if (!window.firebaseDb) return;
  const { doc, deleteDoc } = window.firebaseModules;
  try {
    await deleteDoc(doc(window.firebaseDb, "feedbacks", id));
    // remove the private contact record too (ignore if it doesn't exist)
    try { await deleteDoc(doc(window.firebaseDb, "feedbackContacts", id)); } catch (e) { }
  } catch (error) {
    console.error("Error deleting feedback: ", error);
    alert("Error deleting feedback.");
  }
};

// ---------- achievements management ----------
const achievementForm = document.getElementById('upload-achievement-form');
const adminAchievementsList = document.getElementById('admin-achievements-list');

function renderAdminAchievements(achievements) {
  if (achievements.length === 0) {
    adminAchievementsList.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No achievements uploaded yet.</p>';
    return;
  }

  let html = '';
  achievements.forEach(ach => {
    const safeUrl = /^(data:image\/|https:\/\/)/.test(ach.url || '') ? esc(ach.url) : '';
    html += `
      <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; position: relative; background: var(--bg-secondary);">
        <img src="${safeUrl}" alt="${esc(ach.title)}" style="width: 100%; height: 150px; object-fit: contain; background: #000; display: block;" onerror="this.style.display='none'">
        <div style="padding: 0.75rem;">
          <p style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${esc(ach.title)}</p>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; width: 100%;" onclick="deleteAchievement('${esc(ach.id)}')">Delete</button>
        </div>
      </div>
    `;
  });

  adminAchievementsList.innerHTML = html;
}

if (achievementForm) {
  achievementForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('achievement-desc').value.trim();
    const fileInput = document.getElementById('achievement-file');
    const file = fileInput.files ? fileInput.files[0] : null;

    if (!title || !file) {
      alert('Please attach an image and enter a description.');
      return;
    }

    const submitBtn = achievementForm.querySelector('button[type="submit"]');
    submitBtn.innerText = "Processing Image...";
    submitBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = async function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1000;

        if (width > height) {
          if (width > max_size) { height *= max_size / width; width = max_size; }
        } else {
          if (height > max_size) { width *= max_size / height; height = max_size; }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const resizedBaseUrl = canvas.toDataURL('image/jpeg', 0.8);

        if (window.firebaseDb) {
          const { collection, addDoc } = window.firebaseModules;
          submitBtn.innerText = "Uploading to Cloud...";
          try {
            await addDoc(collection(window.firebaseDb, "achievements"), {
              title: title,
              url: resizedBaseUrl,
              timestamp: Date.now()
            });
            achievementForm.reset();
            document.getElementById('file-chosen-text').textContent = "No file chosen yet";
            alert("Achievement photo uploaded successfully!");
          } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to upload achievement data to cloud. Check limits or network.");
          } finally {
            submitBtn.innerText = "Upload Photo";
            submitBtn.disabled = false;
          }
        }
      };
      img.onerror = () => {
        alert('Invalid image file. Please choose a valid image format.');
        submitBtn.innerText = "Upload Photo";
        submitBtn.disabled = false;
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

window.deleteAchievement = async function (id) {
  if (!confirm("Remove this achievement photo?")) return;
  if (!window.firebaseDb) return;
  const { doc, deleteDoc } = window.firebaseModules;
  try {
    await deleteDoc(doc(window.firebaseDb, "achievements", id));
  } catch (error) {
    console.error("Error deleting achievement: ", error);
    alert("Error deleting achievement.");
  }
};

// ---------- Firebase listeners (started after login) ----------
let listenersStarted = false;
function initializeAdminFirebase() {
  if (listenersStarted) return;
  if (window.firebaseDb && window.firebaseModules && adminAchievementsList) {
    listenersStarted = true;
    const { collection, onSnapshot, query, orderBy, limit } = window.firebaseModules;

    const qF = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"), limit(50));
    const loadingEl = document.getElementById('feedback-loading');
    onSnapshot(qF, (snapshot) => {
      const feedbacks = [];
      snapshot.forEach((d) => feedbacks.push({ id: d.id, ...d.data() }));
      lastFeedbacks = feedbacks;
      renderAdminFeedbacks(withEmail(feedbacks));
      if (loadingEl) loadingEl.style.display = 'none';
    }, (err) => {
      console.error('Feedback snapshot error:', err);
      if (loadingEl) {
        loadingEl.style.display = 'block';
        const last = loadingEl.querySelector('div:last-child');
        if (last) last.textContent = 'Error loading feedback.';
      }
    });

    // private contact emails (admin-only collection)
    onSnapshot(collection(window.firebaseDb, "feedbackContacts"), (snap) => {
      contactsError = false;
      contactMap = {};
      snap.forEach(d => { contactMap[d.id] = d.data().email; });
      renderAdminFeedbacks(withEmail(lastFeedbacks));
    }, (err) => {
      console.error('Contacts snapshot error:', err);
      contactsError = true;
      renderAdminFeedbacks(withEmail(lastFeedbacks));
    });

    const qA = query(collection(window.firebaseDb, "achievements"), orderBy("timestamp", "desc"));
    onSnapshot(qA, (snapshot) => {
      const achievements = [];
      snapshot.forEach((d) => achievements.push({ id: d.id, ...d.data() }));
      renderAdminAchievements(achievements);
    });
  } else {
    setTimeout(initializeAdminFirebase, 100);
  }
}

// ---------- change password (via Firebase reset email) ----------
const changePassBtn = document.getElementById('change-pass-btn');
const changePassModal = document.getElementById('change-pass-modal');
const closeChangePass = document.getElementById('close-change-pass');
const changePassForm = document.getElementById('change-pass-form');

if (changePassBtn && changePassModal) {
  changePassBtn.addEventListener('click', () => changePassModal.classList.add('show'));
}
if (closeChangePass && changePassModal) {
  closeChangePass.addEventListener('click', () => changePassModal.classList.remove('show'));
}
window.addEventListener('click', (e) => {
  if (e.target === changePassModal) changePassModal.classList.remove('show');
});

if (changePassForm) {
  changePassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = window.firebaseAuth && window.firebaseAuth.currentUser;
    if (!user) return;
    try {
      await window.firebaseAuthModules.sendPasswordResetEmail(window.firebaseAuth, user.email);
      alert('Password reset email sent to ' + user.email);
      changePassModal.classList.remove('show');
    } catch (err) {
      console.error(err);
      alert('Could not send the reset email. Try again later.');
    }
  });
}
