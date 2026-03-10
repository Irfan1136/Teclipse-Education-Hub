// Theme sync
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
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('teclipse_admin_auth');
    window.location.href = 'index.html';
});

// Admin Reviews Management (Firebase)
const feedbackList = document.getElementById('admin-feedback-list');

function generateAdminStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= rating ? "<i class='bx bxs-star' style='color:#FBBF24'></i>" : "<i class='bx bx-star' style='color:#ccc'></i>";
    }
    return html;
}

function renderAdminFeedbacks(feedbacks) {
    feedbackList.innerHTML = '';

    if (feedbacks.length === 0) {
        feedbackList.innerHTML = '<tr><td colspan="6" class="empty-state">No student feedback found.</td></tr>';
        return;
    }

    feedbacks.forEach((fb) => {
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
    });
}

window.deleteFeedback = async function (id) {
    if (confirm("Are you sure you want to delete this feedback review?")) {
        if (!window.firebaseDb) return;
        const { doc, deleteDoc } = window.firebaseModules;
        try {
            await deleteDoc(doc(window.firebaseDb, "feedbacks", id));
            // UI updates automatically via onSnapshot listener
        } catch (error) {
            console.error("Error deleting feedback: ", error);
            alert("Error deleting feedback.");
        }
    }
}

// --- Achievements Upload Management (Firebase) ---
const achievementForm = document.getElementById('upload-achievement-form');
const adminAchievementsList = document.getElementById('admin-achievements-list');

function renderAdminAchievements(achievements) {
    if (achievements.length === 0) {
        adminAchievementsList.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No achievements uploaded yet.</p>';
        return;
    }

    let html = '';
    achievements.forEach(ach => {
        html += `
            <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; position: relative; background: var(--bg-secondary);">
                <img src="${ach.url}" alt="${ach.title}" style="width: 100%; height: 150px; object-fit: contain; background: #000; display: block;" onerror="this.style.display='none'; this.nextElementSibling.insertAdjacentHTML('afterbegin', '<div style=\\'height:150px;display:flex;align-items:center;justify-content:center;background:#eee;color:#999;\\'>Image Error</div>');">
                <div style="padding: 0.75rem;">
                    <p style="font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${ach.title}</p>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; width: 100%;" onclick="deleteAchievement('${ach.id}')">Delete</button>
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

        if (title && file) {
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
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG to ensure small size suitable for Firestore
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
        } else {
            alert('Please attach an image and enter a description.');
        }
    });
}

window.deleteAchievement = async function (id) {
    if (confirm("Remove this achievement photo?")) {
        if (!window.firebaseDb) return;
        const { doc, deleteDoc } = window.firebaseModules;
        try {
            await deleteDoc(doc(window.firebaseDb, "achievements", id));
            // UI updates automatically via onSnapshot listener
        } catch (error) {
            console.error("Error deleting achievement: ", error);
            alert("Error deleting achievement.");
        }
    }
}

// Start Firebase Listeners with retry logic
function initializeAdminFirebase() {
    if (window.firebaseDb && window.firebaseModules && adminAchievementsList) {
        const { collection, onSnapshot, query, orderBy } = window.firebaseModules;

        // Listen for Feedbacks
        const qF = query(collection(window.firebaseDb, "feedbacks"), orderBy("timestamp", "desc"));
        onSnapshot(qF, (snapshot) => {
            const feedbacks = [];
            snapshot.forEach((doc) => feedbacks.push({ id: doc.id, ...doc.data() }));
            renderAdminFeedbacks(feedbacks);
        });

        // Listen for Achievements
        const qA = query(collection(window.firebaseDb, "achievements"), orderBy("timestamp", "desc"));
        onSnapshot(qA, (snapshot) => {
            const achievements = [];
            snapshot.forEach((doc) => achievements.push({ id: doc.id, ...doc.data() }));
            renderAdminAchievements(achievements);
        });
    } else {
        setTimeout(initializeAdminFirebase, 100);
    }
}

initializeAdminFirebase();
