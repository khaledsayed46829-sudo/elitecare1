// ============================================
// ELITE CARE HOSPITAL - ENHANCED JAVASCRIPT
// WITH USER AUTHENTICATION & DATA MANAGEMENT
// ============================================

// ============================================
// BACKEND API LAYER (PHP + MySQL — see /backend)
// ============================================
// Same-origin relative path: works as soon as this file is served from the
// same host/folder as the backend/ directory (see deployment notes).
const API_BASE = 'backend/';

async function apiCall(path, options) {
    options = options || {};
    const opts = Object.assign({ credentials: 'include' }, options);
    if (opts.body && !opts.headers) {
        opts.headers = { 'Content-Type': 'application/json' };
    }
    try {
        const res = await fetch(API_BASE + path, opts);
        return await res.json();
    } catch (err) {
        console.error('API error on ' + path, err);
        return { success: false, message: 'تعذر الاتصال بالخادم، تأكد أن السيرفر (Apache/MySQL) شغال' };
    }
}

const API = {
    // ---- auth ----
    register: (data) => apiCall('auth/register.php', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiCall('auth/login.php', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => apiCall('auth/logout.php', { method: 'POST' }),
    forgotPassword: (email) => apiCall('auth/forgot_password.php', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, password) => apiCall('auth/reset_password.php', { method: 'POST', body: JSON.stringify({ token, password }) }),
    // ---- doctors ----
    getDoctors: (category) => apiCall('doctors/get_doctors.php' + (category && category !== 'all' ? ('?category=' + encodeURIComponent(category)) : '')),
    manageDoctor: (data) => apiCall('doctors/manage_doctor.php', { method: 'POST', body: JSON.stringify(data) }),
    // ---- services ----
    getServices: () => apiCall('services/get_services.php'),
    manageService: (data) => apiCall('services/manage_service.php', { method: 'POST', body: JSON.stringify(data) }),
    // ---- appointments ----
    getAppointments: () => apiCall('appointments/get_appointments.php'),
    bookAppointment: (data) => apiCall('appointments/book_appointment.php', { method: 'POST', body: JSON.stringify(data) }),
    cancelAppointment: (id) => apiCall('appointments/cancel_appointment.php', { method: 'POST', body: JSON.stringify({ id }) }),
    rescheduleAppointment: (data) => apiCall('appointments/reschedule_appointment.php', { method: 'POST', body: JSON.stringify(data) }),
    // ---- reviews ----
    getReviews: () => apiCall('reviews/get_reviews.php'),
    submitReview: (data) => apiCall('reviews/submit_review.php', { method: 'POST', body: JSON.stringify(data) }),
    // ---- profile ----
    getProfile: () => apiCall('profile/get_profile.php'),
    updateProfile: (data) => apiCall('profile/update_profile.php', { method: 'POST', body: JSON.stringify(data) }),
    // ---- search ----
    search: (q) => apiCall('search/search.php?q=' + encodeURIComponent(q)),
    // ---- admin ----
    getAllAppointments: () => apiCall('admin/get_all_appointments.php'),
    updateAppointmentStatus: (id, status) => apiCall('admin/update_appointment_status.php', { method: 'POST', body: JSON.stringify({ id, status }) }),
    deleteAppointment: (id) => apiCall('admin/delete_appointment.php', { method: 'POST', body: JSON.stringify({ id }) }),
    getUsers: () => apiCall('admin/get_users.php'),
    deleteUser: (id) => apiCall('admin/delete_user.php', { method: 'POST', body: JSON.stringify({ id }) })
};

// ============================================
// ADMIN SESSION FLAG (mirrors server-side is_admin;
// actual authorization is always re-checked server-side)
// ============================================
const AdminAuth = {
    isAdmin() {
        return localStorage.getItem('elitecare_is_admin') === '1';
    },
    setAdmin(isAdmin) {
        if (isAdmin) {
            localStorage.setItem('elitecare_is_admin', '1');
        } else {
            localStorage.removeItem('elitecare_is_admin');
        }
    },
    logout() {
        localStorage.removeItem('elitecare_is_admin');
    }
};

// ============================================
// ADMIN DATA STORE (Doctors / Services / CRUD)
// ============================================
const AdminStore = {
    doctors: [],
    services: [],
    allAppointments: [],
    allUsers: [],

    async refreshDoctors(category) {
        const res = await API.getDoctors(category);
        this.doctors = res.success ? res.doctors : [];
        return this.doctors;
    },
    getDoctors() { return this.doctors; },
    async addDoctor(doctor) {
        const res = await API.manageDoctor(Object.assign({ action: 'add' }, doctor));
        if (res.success) await this.refreshDoctors();
        return res;
    },
    async updateDoctor(id, updates) {
        const res = await API.manageDoctor(Object.assign({ action: 'update', id: id }, updates));
        if (res.success) await this.refreshDoctors();
        return res;
    },
    async deleteDoctor(id) {
        const res = await API.manageDoctor({ action: 'delete', id: id });
        if (res.success) await this.refreshDoctors();
        return res;
    },

    async refreshServices() {
        const res = await API.getServices();
        this.services = res.success ? res.services : [];
        return this.services;
    },
    getServices() { return this.services; },
    async addService(service) {
        const res = await API.manageService(Object.assign({ action: 'add' }, service));
        if (res.success) await this.refreshServices();
        return res;
    },
    async updateService(id, updates) {
        const res = await API.manageService(Object.assign({ action: 'update', id: id }, updates));
        if (res.success) await this.refreshServices();
        return res;
    },
    async deleteService(id) {
        const res = await API.manageService({ action: 'delete', id: id });
        if (res.success) await this.refreshServices();
        return res;
    },

    // Admin-only: every appointment across every patient
    async refreshAllAppointments() {
        const res = await API.getAllAppointments();
        this.allAppointments = res.success ? res.appointments : [];
        return this.allAppointments;
    },
    getAllAppointments() { return this.allAppointments; },
    async updateAppointmentStatus(id, status) {
        const res = await API.updateAppointmentStatus(id, status);
        if (res.success) await this.refreshAllAppointments();
        return res;
    },
    async deleteAppointment(id) {
        const res = await API.deleteAppointment(id);
        if (res.success) await this.refreshAllAppointments();
        return res;
    },

    async refreshUsers() {
        const res = await API.getUsers();
        this.allUsers = res.success ? res.users : [];
        return this.allUsers;
    },
    getAllUsers() { return this.allUsers; },
    async deleteUser(id) {
        const res = await API.deleteUser(id);
        if (res.success) await this.refreshUsers();
        return res;
    }
};

// Global user data management
// NOTE: real auth/session truth lives on the server (PHP session cookie).
// `currentUser` here is just a lightweight client-side cache of the logged-in
// user's profile (set right after a successful login/register response) so
// the UI can render instantly without an extra round trip. Every protected
// action (booking, cancelling, admin actions...) is still independently
// verified server-side via the session cookie on each request.
const UserData = {
    // Get current logged in user (from cache)
    getCurrentUser() {
        const user = localStorage.getItem('elitecare_current_user');
        return user ? JSON.parse(user) : null;
    },

    // Set current user (cache)
    setCurrentUser(userData) {
        localStorage.setItem('elitecare_current_user', JSON.stringify(userData));
    },

    // Remove current user (logout)
    removeCurrentUser() {
        localStorage.removeItem('elitecare_current_user');
    },

    // ---- Appointments (backed by appointments/*.php) ----
    appointments: [],

    async refreshAppointments() {
        const res = await API.getAppointments();
        this.appointments = res.success ? res.appointments : [];
        return this.appointments;
    },

    getAppointments() {
        return this.appointments;
    },

    async addAppointment(appointment) {
        const res = await API.bookAppointment(appointment);
        if (res.success) await this.refreshAppointments();
        return res;
    },

    async cancelAppointment(appointmentId) {
        const res = await API.cancelAppointment(appointmentId);
        if (res.success) await this.refreshAppointments();
        return res;
    },

    async rescheduleAppointment(appointmentId, newDate, newTimeValue, newTimeLabel) {
        const res = await API.rescheduleAppointment({ id: appointmentId, date: newDate, time: newTimeLabel });
        if (res.success) await this.refreshAppointments();
        return res;
    },

    // ---- Local-only demo extras (medical file uploads) ----
    // Not covered by the backend schema, so kept client-side per account,
    // scoped by user id instead of email.
    getLocalExtrasKey(userId) {
        return 'elitecare_local_' + userId;
    },
    getLocalExtras(userId) {
        const data = localStorage.getItem(this.getLocalExtrasKey(userId));
        return data ? JSON.parse(data) : { medicalFiles: [] };
    },
    saveLocalExtras(userId, data) {
        localStorage.setItem(this.getLocalExtrasKey(userId), JSON.stringify(data));
    }
};

// User Authentication (talks to auth/*.php — real DB-backed accounts + sessions)
const Auth = {
    // Register new user
    async register(userData) {
        const res = await API.register({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            confirmPassword: userData.confirmPassword
        });
        if (res.success && res.user) {
            AdminAuth.setAdmin(false);
            UserData.setCurrentUser(res.user);
        }
        return res;
    },

    // Login
    async login(email, password, remember) {
        const res = await API.login({ email, password, remember: !!remember });
        if (res.success) {
            AdminAuth.setAdmin(!!res.isAdmin);
            UserData.setCurrentUser(res.user);
        }
        return res;
    },

    // Logout
    async logout() {
        await API.logout();
        UserData.removeCurrentUser();
        UserData.appointments = [];
        AdminAuth.logout();
    },

    // Check if logged in (client-side hint only; server re-checks the session on every protected request)
    isLoggedIn() {
        return UserData.getCurrentUser() !== null;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    renderPublicDoctors();
    renderPublicServices();
    initLoadingScreen();
    initPageRouting();
    initNavbar();
    initAuthModal();
    initProfileModal();
    initEmergencyModal();
    initParticles();
    initSmoothScroll();
    initCounterAnimation();
    initDepartmentTabs();
    initDoctorsFilter();
    initMobileMenu();
    initBackToTop();
    initScrollAnimations();
    initFormSubmissions();
    initPasswordToggle();
    initDoctorsSlider();
    initProfileTabs();
    initFloatingEmergency();
    initAuthState();
    initAdminDashboard();
});

// ============================================
// AUTH STATE MANAGEMENT
// ============================================
function initAuthState() {
    const loginTrigger = document.getElementById('login-trigger');
    const navAvatar = document.getElementById('nav-avatar');
    const navUserText = document.getElementById('nav-user-text');
    const currentUser = UserData.getCurrentUser();

    if (AdminAuth.isAdmin()) {
        if (navAvatar) {
            navAvatar.innerHTML = '<i class="fas fa-user-shield"></i>';
            navAvatar.classList.add('has-initials');
        }
        if (navUserText) {
            navUserText.textContent = 'لوحة التحكم';
        }
        loginTrigger.style.borderColor = 'var(--gold)';
        loginTrigger.style.color = 'var(--white)';
        loginTrigger.classList.add('logged-in');

        loginTrigger.onclick = function(e) {
            e.preventDefault();
            showAdminDashboard();
        };
        return;
    }

    if (currentUser) {
        // User is logged in - show avatar with initials
        const initials = getInitials(currentUser.firstName, currentUser.lastName);
        if (navAvatar) {
            navAvatar.innerHTML = '<span class="nav-initials">' + initials + '</span>';
            navAvatar.classList.add('has-initials');
        }
        if (navUserText) {
            navUserText.textContent = currentUser.firstName;
        }
        loginTrigger.style.borderColor = 'var(--primary-light)';
        loginTrigger.style.color = 'var(--white)';
        loginTrigger.classList.add('logged-in');

        loginTrigger.onclick = function(e) {
            e.preventDefault();
            openProfileModal();
        };
    } else {
        // User is not logged in - show default icon
        if (navAvatar) {
            navAvatar.innerHTML = '<i class="fas fa-user"></i>';
            navAvatar.classList.remove('has-initials');
        }
        if (navUserText) {
            navUserText.textContent = 'تسجيل الدخول';
        }
        loginTrigger.style.borderColor = '';
        loginTrigger.style.color = '';
        loginTrigger.classList.remove('logged-in');

        loginTrigger.onclick = function(e) {
            e.preventDefault();
            openAuthModal();
        };
    }
}

// Get initials from first and last name
function getInitials(firstName, lastName) {
    let initials = '';
    if (firstName && firstName.length > 0) {
        initials += firstName.charAt(0);
    }
    if (lastName && lastName.length > 0) {
        initials += lastName.charAt(0);
    }
    return initials || 'م';
}

// ============================================
// LOADING SCREEN
// ============================================
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.querySelector('.loading-progress');
    const percentageText = document.querySelector('.loading-percentage');
    if (!loadingScreen) return;

    let progress = 0;
    const totalDuration = 3000;
    const interval = 30;
    const increment = 100 / (totalDuration / interval);

    const loadingInterval = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.classList.add('loading-hidden');
                setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
            }, 300);
        }
        if (progressBar) progressBar.style.width = progress + '%';
        if (percentageText) percentageText.textContent = Math.floor(progress) + '%';
    }, interval);
}

// ============================================
// AUTH MODAL (Login & Register)
// ============================================
function initAuthModal() {
    const modal = document.getElementById('auth-modal');
    const loginTrigger = document.getElementById('login-trigger');
    const closeModal = modal.querySelector('.close-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');

    if (!modal) return;

    // Open modal
    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModalFn() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Show login section
    function showLoginSection() {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
    }

    // Show register section
    function showRegisterSection() {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    }

    // Toggle between login and register
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterSection();
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginSection();
        });
    }

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', closeModalFn);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModalFn();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModalFn();
        }
    });

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('.login-btn');
            const originalText = btn.innerHTML;
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
            btn.disabled = true;

            const result = await Auth.login(email, password, rememberMe);

            if (result.success) {
                btn.innerHTML = '<i class="fas fa-check"></i> تم تسجيل الدخول بنجاح!';
                btn.style.background = 'var(--success)';

                setTimeout(async () => {
                    closeModalFn();
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                    loginForm.reset();

                    // Update UI for logged in user
                    initAuthState();

                    if (result.isAdmin) {
                        showNotification('مرحباً بك في لوحة تحكم المدير', 'success');
                        showAdminDashboard();
                    } else {
                        // Load user data into profile
                        await loadUserProfile();
                        showNotification('تم تسجيل الدخول بنجاح! مرحباً بك ' + result.user.firstName, 'success');
                    }
                }, 800);
            } else {
                btn.innerHTML = originalText;
                btn.disabled = false;
                showNotification(result.message, 'error');
            }
        });
    }

    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('.login-btn');
            const originalText = btn.innerHTML;

            const firstName = document.getElementById('reg-firstname').value;
            const lastName = document.getElementById('reg-lastname').value;
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            // Validation
            if (password !== confirmPassword) {
                showNotification('كلمات المرور غير متطابقة', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
                return;
            }

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
            btn.disabled = true;

            const result = await Auth.register({
                firstName,
                lastName,
                email,
                phone,
                password,
                confirmPassword
            });

            if (result.success) {
                btn.innerHTML = '<i class="fas fa-check"></i> تم إنشاء الحساب!';
                btn.style.background = 'var(--success)';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                    registerForm.reset();

                    // Switch to login
                    showLoginSection();
                    showNotification(result.message + ' يمكنك الآن تسجيل الدخول', 'success');
                }, 800);
            } else {
                btn.innerHTML = originalText;
                btn.disabled = false;
                showNotification(result.message, 'error');
            }
        });
    }
}

// ============================================
// PROFILE MODAL
// ============================================
function initProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    const closeModal = modal.querySelector('.close-modal');
    const logoutBtn = document.getElementById('profile-logout-btn');

    if (closeModal) {
        closeModal.addEventListener('click', closeProfileModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProfileModal();
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            closeProfileModal();
            await Auth.logout();
            initAuthState();
            showNotification('تم تسجيل الخروج بنجاح', 'success');
        });
    }
}

function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        loadUserProfile();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Load user profile data
async function loadUserProfile() {
    const user = UserData.getCurrentUser();
    if (!user) return;

    // Update profile avatar initials
    const profileAvatarInitials = document.getElementById('profile-avatar-initials');
    if (profileAvatarInitials) {
        const initials = getInitials(user.firstName, user.lastName);
        profileAvatarInitials.innerHTML = '<span>' + initials + '</span>';
    }

    // Update profile name
    const profileName = document.getElementById('profile-name');
    const profileId = document.getElementById('profile-id');

    if (profileName) {
        profileName.textContent = user.firstName + ' ' + user.lastName;
    }
    if (profileId) {
        // Generate a patient ID based on email hash
        const hash = user.email.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        profileId.textContent = '#PAT-2026-' + Math.abs(hash).toString().padStart(3, '0');
    }

    // Update settings form
    const settingFirstname = document.getElementById('setting-firstname');
    const settingLastname = document.getElementById('setting-lastname');
    const settingEmail = document.getElementById('setting-email');
    const settingPhone = document.getElementById('setting-phone');

    if (settingFirstname) settingFirstname.value = user.firstName || '';
    if (settingLastname) settingLastname.value = user.lastName || '';
    if (settingEmail) settingEmail.value = user.email || '';
    if (settingPhone) settingPhone.value = user.phone || '';

    // Load user appointments from backend
    await UserData.refreshAppointments();
    loadUserAppointments();

    // Update stats
    updateProfileStats();
}

// Load user appointments into profile
function loadUserAppointments() {
    const appointments = UserData.getAppointments();
    const upcomingContainer = document.getElementById('upcoming-appointments');
    const appointmentsTbody = document.getElementById('appointments-tbody');

    // Update upcoming appointments
    if (upcomingContainer) {
        if (appointments.length === 0) {
            upcomingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <p>لا توجد مواعيد قادمة</p>
                    <a href="#appointments" class="btn btn-primary" data-page="appointments" onclick="closeProfileModal()">احجز موعد الآن</a>
                </div>
            `;
        } else {
            // Sort appointments by date
            const sortedAppointments = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
            const upcoming = sortedAppointments.filter(a => new Date(a.date) >= new Date());

            if (upcoming.length === 0) {
                upcomingContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-plus"></i>
                        <p>لا توجد مواعيد قادمة</p>
                        <a href="#appointments" class="btn btn-primary" data-page="appointments" onclick="closeProfileModal()">احجز موعد الآن</a>
                    </div>
                `;
            } else {
                upcomingContainer.innerHTML = upcoming.slice(0, 3).map(app => {
                    const date = new Date(app.date);
                    const day = date.getDate();
                    const month = date.toLocaleString('ar-EG', { month: 'long' });

                    return `
                        <div class="upcoming-item">
                            <div class="upcoming-date"><span class="day">${day}</span><span class="month">${month}</span></div>
                            <div class="upcoming-details">
                                <h4>${app.doctorName} - ${app.specialty}</h4>
                                <p><i class="fas fa-clock"></i> ${app.time} | <i class="fas fa-map-marker-alt"></i> العيادة</p>
                            </div>
                            <span class="upcoming-status ${app.status}">${getStatusText(app.status)}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // Update appointments table
    if (appointmentsTbody) {
        if (appointments.length === 0) {
            appointmentsTbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-calendar-plus"></i>
                            <p>لا توجد مواعيد مسجلة</p>
                            <a href="#appointments" class="btn btn-primary" data-page="appointments" onclick="closeProfileModal()">احجز موعد الآن</a>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            appointmentsTbody.innerHTML = appointments.map(app => {
                const date = new Date(app.date);
                const dateStr = date.toLocaleDateString('ar-EG');

                return `
                    <tr>
                        <td>${dateStr}</td>
                        <td>${app.doctorName}</td>
                        <td>${app.specialty}</td>
                        <td>${app.time}</td>
                        <td><span class="status-badge ${app.status}">${getStatusText(app.status)}</span></td>
                        <td>
                            <button class="action-btn" onclick="viewAppointment(${app.id})"><i class="fas fa-eye"></i></button>
                            ${app.status !== 'cancelled' && app.status !== 'completed' ? `<button class="action-btn reschedule" onclick="openRescheduleModal(${app.id})" title="تأجيل الموعد"><i class="fas fa-calendar-alt"></i></button>` : ''}
                            <button class="action-btn cancel" onclick="cancelAppointment(${app.id})"><i class="fas fa-times"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'confirmed': 'مؤكد',
        'completed': 'تمت',
        'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
}

function viewAppointment(id) {
    const appointments = UserData.getAppointments();
    const app = appointments.find(a => a.id === id);
    if (!app) return;

    const date = new Date(app.date).toLocaleDateString('ar-EG');
    const details = `
        📅 التاريخ: ${date}
        👨‍⚕️ الطبيب: ${app.doctorName}
        🏥 التخصص: ${app.specialty}
        ⏰ الوقت: ${app.time}
        📋 الحالة: ${getStatusText(app.status)}
        ${app.notes ? '📝 ملاحظات: ' + app.notes : ''}
    `;

    showNotification('تفاصيل الموعد: ' + app.doctorName + ' - ' + date, 'success');
}

async function cancelAppointment(id) {
    if (confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) {
        const res = await UserData.cancelAppointment(id);
        if (res.success) {
            loadUserAppointments();
            updateProfileStats();
            showNotification('تم إلغاء الموعد بنجاح', 'success');
        } else {
            showNotification(res.message || 'تعذر إلغاء الموعد', 'error');
        }
    }
}

function updateProfileStats() {
    const appointments = UserData.getAppointments();
    const statAppointments = document.getElementById('stat-appointments');

    if (statAppointments) {
        const thisMonth = appointments.filter(a => {
            const date = new Date(a.date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;
        statAppointments.textContent = thisMonth;
    }
}

// ============================================
// PROFILE TABS
// ============================================
function initProfileTabs() {
    const tabBtns = document.querySelectorAll('.profile-nav-btn');
    const tabs = document.querySelectorAll('.profile-tab');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = document.getElementById(tabId + '-tab');
            if (targetTab) targetTab.classList.add('active');
        });
    });
}

// ============================================
// EMERGENCY MODAL
// ============================================
function initEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    const emergencyBtn = document.getElementById('emergency-btn');
    const floatingEmergencyBtn = document.getElementById('floating-emergency-btn');
    const closeModal = modal.querySelector('.close-modal');

    if (!modal) return;

    function openEmergency() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeEmergency() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (emergencyBtn) emergencyBtn.addEventListener('click', openEmergency);
    if (floatingEmergencyBtn) floatingEmergencyBtn.addEventListener('click', openEmergency);
    if (closeModal) closeModal.addEventListener('click', closeEmergency);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEmergency();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeEmergency();
        }
    });

    const locationBtn = document.getElementById('emergency-location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', () => {
            window.open('https://maps.google.com/?q=123+Elite+Street+Cairo+Egypt', '_blank');
        });
    }
}

// ============================================
// FLOATING EMERGENCY BUTTON
// ============================================
function initFloatingEmergency() {
    const floatingBtn = document.getElementById('floating-emergency-btn');
    if (!floatingBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            floatingBtn.style.opacity = '1';
            floatingBtn.style.visibility = 'visible';
        } else {
            floatingBtn.style.opacity = '0';
            floatingBtn.style.visibility = 'hidden';
        }
    });
}

// ============================================
// PARTICLES ANIMATION
// ============================================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particle.style.animationDelay = (Math.random() * 5) + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        particlesContainer.appendChild(particle);
    }
}

// ============================================
// PAGE ROUTING SYSTEM (SPA)
// ============================================
function initPageRouting() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('[data-page]');
        if (!link) return;
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        if (pageId) navigateToPage(pageId);
    });

    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.page) {
            showPage(e.state.page, false);
        }
    });
}

function navigateToPage(pageId) {
    showPage(pageId, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPage(pageId, pushState = true) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });

    if (pushState) {
        history.pushState({ page: pageId }, '', '#' + pageId);
    }

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
    }

    // The admin dashboard has its own layout/sidebar, so hide the public
    // site navbar (and floating widgets) while it's open.
    document.body.classList.toggle('admin-mode', pageId === 'admin-dashboard');
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }
        });
    });
}

// ============================================
// COUNTER ANIMATION
// ============================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;

    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const increment = target / speed;

        if (count < target) {
            counter.innerText = Math.ceil(count + increment);
            setTimeout(() => animateCounter(counter), 20);
        } else {
            if (target >= 1000) {
                counter.innerText = (target / 1000).toFixed(0) + 'K+';
            } else {
                counter.innerText = target + '+';
            }
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                animateCounter(counter);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

// ============================================
// DEPARTMENT TABS (Full Page)
// ============================================
function initDepartmentTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn-full');
    const tabContents = document.querySelectorAll('.tab-content-full');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(tabId + '-full');
            if (target) target.classList.add('active');
        });
    });
}

// ============================================
// DOCTORS FILTER
// ============================================
function initDoctorsFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const doctorCards = document.querySelectorAll('.doctor-card-full');
            doctorCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'grid';
                    card.style.animation = 'fadeInUp 0.4s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.service-card, .doctor-card, .testimonial-card, .feature-item, .info-card, .contact-card, .quick-card, .mv-card, .cert-card, .story-stat, .service-card-full, .doctor-card-full, .tab-stat-full'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ============================================
// FORM SUBMISSIONS
// ============================================
function initFormSubmissions() {
    // Appointment form - books a real appointment via the backend
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Check if user is logged in
            if (!Auth.isLoggedIn()) {
                showNotification('يجب تسجيل الدخول أولاً لحجز موعد', 'error');
                openAuthModal();
                return;
            }

            const doctorSelect = document.getElementById('app-doctor');
            const specialtySelect = document.getElementById('app-specialty');
            const timeSelect = document.getElementById('app-time');

            const appointment = {
                doctorId: doctorSelect.value || null,
                doctorName: doctorSelect.options[doctorSelect.selectedIndex].text,
                specialty: specialtySelect.options[specialtySelect.selectedIndex].text,
                date: document.getElementById('app-date').value,
                time: timeSelect.options[timeSelect.selectedIndex].text,
                notes: document.getElementById('app-notes').value
            };

            const submitBtn = appointmentForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحجز...';
                submitBtn.disabled = true;
            }

            const res = await UserData.addAppointment(appointment);

            if (submitBtn) {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }

            if (res.success) {
                showNotification('تم تأكيد حجزك بنجاح! سنتواصل معك قريباً.', 'success');
                appointmentForm.reset();
            } else {
                showNotification(res.message || 'حدث خطأ أثناء حفظ الموعد', 'error');
            }
        });
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('تم إرسال رسالتك بنجاح! شكراً لتواصلك معنا.', 'success');
            contactForm.reset();
        });
    }

    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('تم الاشتراك في النشرة البريدية بنجاح!', 'success');
            newsletterForm.reset();
        });
    }

    // Book doctor buttons are handled by the delegated [data-page] click
    // listener in initPageRouting(), so they work for doctors added later
    // from the admin dashboard too.

    // Save profile settings
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const user = UserData.getCurrentUser();
            if (!user) return;

            const firstName = document.getElementById('setting-firstname').value;
            const lastName = document.getElementById('setting-lastname').value;
            const phone = document.getElementById('setting-phone').value;

            const originalText = saveProfileBtn.innerHTML;
            saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            saveProfileBtn.disabled = true;

            const res = await API.updateProfile({ firstName, lastName, phone });

            saveProfileBtn.innerHTML = originalText;
            saveProfileBtn.disabled = false;

            if (res.success) {
                // Update local cache
                user.firstName = firstName;
                user.lastName = lastName;
                user.phone = phone;
                UserData.setCurrentUser(user);

                initAuthState();
                loadUserProfile();
                showNotification('تم حفظ التغييرات بنجاح', 'success');
            } else {
                showNotification(res.message || 'تعذر حفظ التغييرات', 'error');
            }
        });
    }
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// ============================================
// PASSWORD TOGGLE
// ============================================
function initPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.classList.remove('fa-eye');
                    btn.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    btn.classList.remove('fa-eye-slash');
                    btn.classList.add('fa-eye');
                }
            }
        });
    });
}

// ============================================
// DOCTORS SLIDER
// ============================================
function initDoctorsSlider() {
    const prevBtn = document.getElementById('prev-doctor-home');
    const nextBtn = document.getElementById('next-doctor-home');
    const slider = document.getElementById('doctors-slider-home');

    if (prevBtn && nextBtn && slider) {
        const cardWidth = 320;
        nextBtn.addEventListener('click', () => {
            slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
        });
        prevBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });
    }
}

// ============================================
// PUBLIC RENDERING: DOCTORS & SERVICES
// (Driven by AdminStore so admin add/delete instantly
//  reflects on the live site)
// ============================================
function starsHtml(rating) {
    let html = '';
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
    if (half) html += '<i class="fas fa-star-half-alt"></i>';
    const rest = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < rest; i++) html += '<i class="far fa-star"></i>';
    return html;
}

function doctorImageHtml(d) {
    return d.image
        ? `<img src="${d.image}" alt="${d.name}">`
        : `<div class="doctor-no-image"><i class="fas fa-user-md"></i></div>`;
}

async function renderPublicDoctors() {
    await AdminStore.refreshDoctors();
    const doctors = AdminStore.getDoctors();

    // Home page slider (first 6)
    const homeSlider = document.getElementById('doctors-slider-home');
    if (homeSlider) {
        homeSlider.innerHTML = doctors.map(d => `
            <div class="doctor-card">
                <div class="doctor-image">
                    ${doctorImageHtml(d)}
                    <div class="doctor-overlay"><div class="doctor-social"><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter"><i class="fab fa-twitter"></i></a><a href="mailto:contact@elitecare.com" title="إرسال بريد إلكتروني"><i class="fas fa-envelope"></i></a></div></div>
                </div>
                <div class="doctor-info">
                    <h3>${d.name}</h3><span class="doctor-specialty">${d.specialty}</span>
                    <div class="doctor-rating">${starsHtml(d.rating)}<span>${d.rating.toFixed(1)}</span></div>
                    <p class="doctor-experience">${d.experience} - ${d.degree}</p>
                    <button class="book-doctor-btn" data-page="appointments">احجز موعد</button>
                </div>
            </div>
        `).join('');
    }

    // Full doctors page grid
    const fullGrid = document.querySelector('.doctors-grid-full');
    if (fullGrid) {
        if (doctors.length === 0) {
            fullGrid.innerHTML = '<p class="admin-empty-msg">لا يوجد أطباء حالياً</p>';
        } else {
            fullGrid.innerHTML = doctors.map(d => `
                <div class="doctor-card-full" data-category="${d.category}">
                    <div class="doctor-card-image">${doctorImageHtml(d)}</div>
                    <div class="doctor-card-info">
                        <h3>${d.name}</h3>
                        <span class="doctor-card-specialty">${d.specialty}</span>
                        <div class="doctor-card-rating">${starsHtml(d.rating)}<span>${d.rating.toFixed(1)} (${d.ratingCount} تقييم)</span></div>
                        <div class="doctor-card-details">
                            <p><i class="fas fa-graduation-cap"></i> ${d.degree}</p>
                            <p><i class="fas fa-clock"></i> ${d.experience}</p>
                            <p><i class="fas fa-language"></i> ${d.languages}</p>
                        </div>
                        <div class="doctor-card-schedule"><span class="schedule-day">${d.scheduleDay}</span><span class="schedule-time">${d.scheduleTime}</span></div>
                        <button class="btn btn-primary book-doctor-btn" data-page="appointments"><i class="fas fa-calendar-check"></i> احجز موعد</button>
                    </div>
                </div>
            `).join('');
        }
    }

    populateAppointmentDoctorSelect(doctors);
}

// Keep the "احجز موعد" form's doctor dropdown in sync with the real doctors list
function populateAppointmentDoctorSelect(doctors) {
    const select = document.getElementById('app-doctor');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">اختر الطبيب</option>' +
        doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
    if (currentValue && doctors.some(d => String(d.id) === currentValue)) {
        select.value = currentValue;
    }
}

async function renderPublicServices() {
    await AdminStore.refreshServices();
    const services = AdminStore.getServices();

    // Home page preview (first 4)
    const homeGrid = document.querySelector('.services-preview .services-grid');
    if (homeGrid) {
        homeGrid.innerHTML = services.slice(0, 4).map(s => `
            <div class="service-card"><div class="service-icon"><i class="fas ${s.icon}"></i></div><h3>${s.title}</h3><p>${s.shortDesc}</p><a href="#services" class="service-link" data-page="services">المزيد <i class="fas fa-arrow-left"></i></a></div>
        `).join('');
    }

    // Full services page grid
    const fullGrid = document.querySelector('.services-grid-full');
    if (fullGrid) {
        if (services.length === 0) {
            fullGrid.innerHTML = '<p class="admin-empty-msg">لا يوجد خدمات حالياً</p>';
        } else {
            fullGrid.innerHTML = services.map(s => `
                <div class="service-card-full">
                    <div class="service-card-header"><div class="service-icon-large"><i class="fas ${s.icon}"></i></div><h3>${s.title}</h3></div>
                    <p>${s.fullDesc}</p>
                    <ul class="service-features">
                        ${(s.features || []).map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
                    </ul>
                    <a href="#appointments" class="btn btn-primary" data-page="appointments"><i class="fas fa-calendar-check"></i> احجز موعد</a>
                </div>
            `).join('');
        }
    }
}

// ============================================
// ADMIN DASHBOARD
// ============================================
let currentAdminDoctorEditId = null;
let currentAdminServiceEditId = null;

function initAdminDashboard() {
    const tabBtns = document.querySelectorAll('.admin-nav-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-admin-tab');
            switchAdminTab(tab);
        });
    });

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await Auth.logout();
            navigateToPage('home');
            initAuthState();
            showNotification('تم تسجيل خروج المدير بنجاح', 'success');
        });
    }

    // Doctor modal
    const addDoctorBtn = document.getElementById('add-doctor-btn');
    if (addDoctorBtn) addDoctorBtn.addEventListener('click', () => openDoctorModal());
    const doctorForm = document.getElementById('admin-doctor-form');
    if (doctorForm) doctorForm.addEventListener('submit', handleDoctorFormSubmit);
    const doctorModalClose = document.querySelector('#admin-doctor-modal .close-modal');
    if (doctorModalClose) doctorModalClose.addEventListener('click', () => closeAdminModal('admin-doctor-modal'));

    // Service modal
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) addServiceBtn.addEventListener('click', () => openServiceModal());
    const serviceForm = document.getElementById('admin-service-form');
    if (serviceForm) serviceForm.addEventListener('submit', handleServiceFormSubmit);
    const serviceModalClose = document.querySelector('#admin-service-modal .close-modal');
    if (serviceModalClose) serviceModalClose.addEventListener('click', () => closeAdminModal('admin-service-modal'));
}

async function switchAdminTab(tab) {
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    const btn = document.querySelector(`.admin-nav-btn[data-admin-tab="${tab}"]`);
    const content = document.getElementById('admin-tab-' + tab);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');

    const titles = {
        overview: 'نظرة عامة', doctors: 'إدارة الأطباء', services: 'إدارة الخدمات',
        appointments: 'إدارة الحجوزات', users: 'إدارة المستخدمين', reviews: 'إدارة التقييمات'
    };
    const titleEl = document.getElementById('admin-tab-title');
    if (titleEl) titleEl.textContent = titles[tab] || 'لوحة التحكم';

    if (tab === 'overview') await renderAdminOverview();
    if (tab === 'doctors') await renderAdminDoctorsTable();
    if (tab === 'services') await renderAdminServicesTable();
    if (tab === 'appointments') await renderAdminAppointmentsTable();
    if (tab === 'users') await renderAdminUsersTable();
    if (tab === 'reviews') await renderAdminReviewsTable();
}

function showAdminDashboard() {
    navigateToPage('admin-dashboard');
    switchAdminTab('overview');
}

async function renderAdminOverview() {
    const grid = document.getElementById('admin-stats-grid');
    if (!grid) return;
    const [users, appointments, doctors, services] = await Promise.all([
        AdminStore.refreshUsers(),
        AdminStore.refreshAllAppointments(),
        AdminStore.refreshDoctors(),
        AdminStore.refreshServices()
    ]);
    const pending = appointments.filter(a => a.status === 'pending').length;

    grid.innerHTML = `
        <div class="admin-stat-card"><div class="admin-stat-icon"><i class="fas fa-users"></i></div><div><h3>${users.length}</h3><p>المستخدمين المسجلين</p></div></div>
        <div class="admin-stat-card"><div class="admin-stat-icon"><i class="fas fa-calendar-check"></i></div><div><h3>${appointments.length}</h3><p>إجمالي الحجوزات</p></div></div>
        <div class="admin-stat-card"><div class="admin-stat-icon"><i class="fas fa-hourglass-half"></i></div><div><h3>${pending}</h3><p>حجوزات قيد الانتظار</p></div></div>
        <div class="admin-stat-card"><div class="admin-stat-icon"><i class="fas fa-user-md"></i></div><div><h3>${doctors.length}</h3><p>عدد الأطباء</p></div></div>
        <div class="admin-stat-card"><div class="admin-stat-icon"><i class="fas fa-stethoscope"></i></div><div><h3>${services.length}</h3><p>عدد الخدمات</p></div></div>
    `;
}

async function renderAdminDoctorsTable() {
    const tbody = document.querySelector('#admin-doctors-table tbody');
    if (!tbody) return;
    await AdminStore.refreshDoctors();
    const doctors = AdminStore.getDoctors();
    if (doctors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-empty-msg">لا يوجد أطباء</td></tr>';
        return;
    }
    tbody.innerHTML = doctors.map(d => `
        <tr>
            <td>${d.image
                ? `<img class="admin-table-avatar" src="${d.image}" alt="${d.name}">`
                : `<span class="admin-table-avatar doctor-no-image-sm"><i class="fas fa-user-md"></i></span>`}</td>
            <td>${d.name}</td>
            <td>${d.specialty}</td>
            <td>${d.rating.toFixed(1)} <i class="fas fa-star" style="color:var(--gold)"></i></td>
            <td class="admin-actions-cell">
                <button class="admin-icon-btn edit" onclick="openDoctorModal(${d.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="admin-icon-btn delete" onclick="confirmDeleteDoctor(${d.id})" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openDoctorModal(id) {
    const modal = document.getElementById('admin-doctor-modal');
    const form = document.getElementById('admin-doctor-form');
    const title = document.getElementById('admin-doctor-modal-title');
    form.reset();
    currentAdminDoctorEditId = null;

    if (id) {
        const doctor = AdminStore.getDoctors().find(d => d.id === id);
        if (doctor) {
            currentAdminDoctorEditId = id;
            title.textContent = 'تعديل بيانات الطبيب';
            document.getElementById('doc-name').value = doctor.name;
            document.getElementById('doc-specialty').value = doctor.specialty;
            document.getElementById('doc-category').value = doctor.category;
            document.getElementById('doc-image').value = doctor.image;
            document.getElementById('doc-rating').value = doctor.rating;
            document.getElementById('doc-rating-count').value = doctor.ratingCount;
            document.getElementById('doc-degree').value = doctor.degree;
            document.getElementById('doc-experience').value = doctor.experience;
            document.getElementById('doc-languages').value = doctor.languages;
            document.getElementById('doc-schedule-day').value = doctor.scheduleDay;
            document.getElementById('doc-schedule-time').value = doctor.scheduleTime;
        }
    } else {
        title.textContent = 'إضافة طبيب جديد';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function handleDoctorFormSubmit(e) {
    e.preventDefault();
    const doctor = {
        name: document.getElementById('doc-name').value.trim(),
        specialty: document.getElementById('doc-specialty').value.trim(),
        category: document.getElementById('doc-category').value,
        image: document.getElementById('doc-image').value.trim(),
        rating: parseFloat(document.getElementById('doc-rating').value) || 5.0,
        ratingCount: parseInt(document.getElementById('doc-rating-count').value) || 0,
        degree: document.getElementById('doc-degree').value.trim(),
        experience: document.getElementById('doc-experience').value.trim(),
        languages: document.getElementById('doc-languages').value.trim(),
        scheduleDay: document.getElementById('doc-schedule-day').value.trim(),
        scheduleTime: document.getElementById('doc-schedule-time').value.trim()
    };

    const res = currentAdminDoctorEditId
        ? await AdminStore.updateDoctor(currentAdminDoctorEditId, doctor)
        : await AdminStore.addDoctor(doctor);

    if (!res.success) {
        showNotification(res.message || 'حدث خطأ، حاول مرة أخرى', 'error');
        return;
    }
    showNotification(currentAdminDoctorEditId ? 'تم تحديث بيانات الطبيب بنجاح' : 'تمت إضافة الطبيب بنجاح', 'success');

    closeAdminModal('admin-doctor-modal');
    renderAdminDoctorsTable();
    renderAdminOverview();
    renderPublicDoctors();
}

async function confirmDeleteDoctor(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطبيب؟')) {
        const res = await AdminStore.deleteDoctor(id);
        if (!res.success) {
            showNotification(res.message || 'تعذر حذف الطبيب', 'error');
            return;
        }
        renderAdminDoctorsTable();
        renderAdminOverview();
        renderPublicDoctors();
        showNotification('تم حذف الطبيب بنجاح', 'success');
    }
}

async function renderAdminServicesTable() {
    const tbody = document.querySelector('#admin-services-table tbody');
    if (!tbody) return;
    await AdminStore.refreshServices();
    const services = AdminStore.getServices();
    if (services.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="admin-empty-msg">لا يوجد خدمات</td></tr>';
        return;
    }
    tbody.innerHTML = services.map(s => `
        <tr>
            <td><i class="fas ${s.icon} admin-service-icon"></i></td>
            <td>${s.title}</td>
            <td>${s.shortDesc}</td>
            <td class="admin-actions-cell">
                <button class="admin-icon-btn edit" onclick="openServiceModal(${s.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="admin-icon-btn delete" onclick="confirmDeleteService(${s.id})" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openServiceModal(id) {
    const modal = document.getElementById('admin-service-modal');
    const form = document.getElementById('admin-service-form');
    const title = document.getElementById('admin-service-modal-title');
    form.reset();
    currentAdminServiceEditId = null;

    if (id) {
        const service = AdminStore.getServices().find(s => s.id === id);
        if (service) {
            currentAdminServiceEditId = id;
            title.textContent = 'تعديل الخدمة';
            document.getElementById('svc-title').value = service.title;
            document.getElementById('svc-icon').value = service.icon;
            document.getElementById('svc-short-desc').value = service.shortDesc;
            document.getElementById('svc-full-desc').value = service.fullDesc;
            document.getElementById('svc-features').value = (service.features || []).join('\n');
        }
    } else {
        title.textContent = 'إضافة خدمة جديدة';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function handleServiceFormSubmit(e) {
    e.preventDefault();
    const featuresRaw = document.getElementById('svc-features').value.trim();
    const service = {
        title: document.getElementById('svc-title').value.trim(),
        icon: document.getElementById('svc-icon').value.trim() || 'fa-notes-medical',
        shortDesc: document.getElementById('svc-short-desc').value.trim(),
        fullDesc: document.getElementById('svc-full-desc').value.trim(),
        features: featuresRaw ? featuresRaw.split('\n').map(f => f.trim()).filter(Boolean) : []
    };

    const res = currentAdminServiceEditId
        ? await AdminStore.updateService(currentAdminServiceEditId, service)
        : await AdminStore.addService(service);

    if (!res.success) {
        showNotification(res.message || 'حدث خطأ، حاول مرة أخرى', 'error');
        return;
    }
    showNotification(currentAdminServiceEditId ? 'تم تحديث الخدمة بنجاح' : 'تمت إضافة الخدمة بنجاح', 'success');

    closeAdminModal('admin-service-modal');
    renderAdminServicesTable();
    renderAdminOverview();
    renderPublicServices();
}

async function confirmDeleteService(id) {
    if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
        const res = await AdminStore.deleteService(id);
        if (!res.success) {
            showNotification(res.message || 'تعذر حذف الخدمة', 'error');
            return;
        }
        renderAdminServicesTable();
        renderAdminOverview();
        renderPublicServices();
        showNotification('تم حذف الخدمة بنجاح', 'success');
    }
}

async function renderAdminAppointmentsTable() {
    const tbody = document.querySelector('#admin-appointments-table tbody');
    if (!tbody) return;
    await AdminStore.refreshAllAppointments();
    const appointments = AdminStore.getAllAppointments();
    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-empty-msg">لا يوجد حجوزات</td></tr>';
        return;
    }
    tbody.innerHTML = appointments.map(a => `
        <tr>
            <td>${a.patientName || '—'}</td>
            <td>${a.patientEmail}</td>
            <td>${a.doctorName || '—'}${a.specialty ? ' - ' + a.specialty : ''}</td>
            <td>${a.date || '—'}</td>
            <td>
                <select class="admin-status-select status-${a.status}" onchange="changeAppointmentStatus(${a.id}, this.value)">
                    <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                    <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
                    <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                    <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                </select>
            </td>
            <td class="admin-actions-cell">
                <button class="admin-icon-btn delete" onclick="confirmDeleteAppointment(${a.id})" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function changeAppointmentStatus(id, status) {
    const res = await AdminStore.updateAppointmentStatus(id, status);
    if (!res.success) {
        showNotification(res.message || 'تعذر تحديث الحالة', 'error');
        return;
    }
    renderAdminAppointmentsTable();
    renderAdminOverview();
    showNotification('تم تحديث حالة الحجز', 'success');
}

async function confirmDeleteAppointment(id) {
    if (confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
        const res = await AdminStore.deleteAppointment(id);
        if (!res.success) {
            showNotification(res.message || 'تعذر حذف الحجز', 'error');
            return;
        }
        renderAdminAppointmentsTable();
        renderAdminOverview();
        showNotification('تم حذف الحجز بنجاح', 'success');
    }
}

async function renderAdminUsersTable() {
    const tbody = document.querySelector('#admin-users-table tbody');
    if (!tbody) return;
    await AdminStore.refreshUsers();
    const users = AdminStore.getAllUsers();
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-empty-msg">لا يوجد مستخدمين</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.firstName || ''} ${u.lastName || ''}</td>
            <td>${u.email}</td>
            <td>${u.phone || '—'}</td>
            <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : '—'}</td>
            <td class="admin-actions-cell">
                <button class="admin-icon-btn delete" onclick="confirmDeleteUser(${u.id})" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function confirmDeleteUser(id) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم وكل بياناته؟')) {
        const res = await AdminStore.deleteUser(id);
        if (!res.success) {
            showNotification(res.message || 'تعذر حذف المستخدم', 'error');
            return;
        }
        renderAdminUsersTable();
        renderAdminOverview();
        initAuthState();
        showNotification('تم حذف المستخدم بنجاح', 'success');
    }
}

async function renderAdminReviewsTable() {
    const tbody = document.querySelector('#admin-reviews-table tbody');
    if (!tbody) return;
    const res = await API.getReviews();
    const reviews = res.success ? res.reviews : [];
    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="admin-empty-msg">لا يوجد تقييمات</td></tr>';
        return;
    }
    tbody.innerHTML = reviews.map(r => `
        <tr>
            <td>${r.patientName || '—'} <span style="color:var(--gray-light); font-size:.85em;">(${r.doctorName || ''})</span></td>
            <td>${r.rating ? r.rating.toFixed ? r.rating.toFixed(1) : r.rating : '—'}</td>
            <td>${r.comment || '—'}</td>
        </tr>
    `).join('');
}

function closeAdminModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed; top: 100px; left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white; padding: 1rem 2rem; border-radius: 12px;
        display: flex; align-items: center; gap: 0.75rem;
        font-weight: 500; z-index: 100000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        opacity: 0; transition: all 0.4s ease;
        font-family: 'Cairo', sans-serif;
    `;

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}


// ============================================
// INFO MODALS (Terms, Privacy, Sitemap, Forgot Password)
// ============================================

// Change password function
function changePassword() {
    const user = UserData.getCurrentUser();
    if (!user) {
        showNotification('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    showNotification('تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني', 'success');
}

function showTerms() {
    closeAllModals();
    const modal = document.getElementById('terms-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function showPrivacy() {
    closeAllModals();
    const modal = document.getElementById('privacy-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function showSitemap() {
    closeAllModals();
    const modal = document.getElementById('sitemap-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function showForgotPassword() {
    // Close only the auth modal, not all modals (so forgot-modal can open)
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.remove('active');
    }
    const modal = document.getElementById('forgot-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeForgotModal() {
    const modal = document.getElementById('forgot-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// Initialize info modals
document.addEventListener('DOMContentLoaded', function() {
    // Close buttons for all modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Forgot password form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            const btn = forgotForm.querySelector('.login-btn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
            btn.disabled = true;

            const res = await API.forgotPassword(email);

            if (res.success) {
                btn.innerHTML = '<i class="fas fa-check"></i> تم إرسال الرابط!';
                btn.style.background = 'var(--success)';
                showNotification(res.message, 'success');

                setTimeout(() => {
                    closeForgotModal();
                    btn.innerHTML = '<span>إرسال رابط الاستعادة</span><i class="fas fa-paper-plane"></i>';
                    btn.style.background = '';
                    btn.disabled = false;
                    forgotForm.reset();
                }, 2000);
            } else {
                btn.innerHTML = '<span>إرسال رابط الاستعادة</span><i class="fas fa-paper-plane"></i>';
                btn.disabled = false;
                showNotification(res.message || 'حدث خطأ، حاول مرة أخرى', 'error');
            }
        });
    }
});

// ============================================
// PARALLAX EFFECT FOR HERO
// ============================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg && scrolled < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ============================================
// CURSOR GLOW EFFECT
// ============================================
if (window.matchMedia('(hover: hover)').matches) {
    const cursorGlow = document.createElement('div');
    cursorGlow.style.cssText = `
        position: fixed; width: 300px; height: 300px;
        background: radial-gradient(circle, rgba(46, 134, 171, 0.15) 0%, transparent 70%);
        border-radius: 50%; pointer-events: none; z-index: 9998;
        transform: translate(-50%, -50%); transition: opacity 0.3s ease;
    `;
    document.body.appendChild(cursorGlow);

    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });

    document.addEventListener('mouseenter', () => { cursorGlow.style.opacity = '1'; });
    document.addEventListener('mouseleave', () => { cursorGlow.style.opacity = '0'; });
}

// ============================================
// CONFETTI EFFECT
// ============================================
function createConfetti() {
    const colors = ['#2e86ab', '#1a5276', '#27ae60', '#e67e22', '#d4af37'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed; width: 10px; height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            top: -10px; left: ${Math.random() * 100}vw; z-index: 100001;
            animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
`;
document.head.appendChild(confettiStyle);

const originalShowNotification = showNotification;
window.showNotification = function(message, type) {
    if (type === 'success') createConfetti();
    originalShowNotification(message, type);
};

// ============================================
// MAGNETIC BUTTON EFFECT
// ============================================
if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn, .service-card, .doctor-card, .quick-card').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
}

// ============================================
// LAZY LOADING IMAGES
// ============================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    document.querySelectorAll('img').forEach(img => imageObserver.observe(img));
}

// ============================================================
// EXTRA FEATURES — ADDED BLOCK
// (Everything below is additive and does not alter the code above)
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    initSiteSearch();
    initLangToggle();
    initSocialAuth();
    initMedicalUpload();
    initFAQPage();
    initInsurancePage();
    initBlogPage();
    initReviewSystem();
    initRescheduleSystem();
    initPaymentSystem();
    renderMedicalFiles();
});

// ------------------------------------------------------------
// 1) RESCHEDULE APPOINTMENT ("تأجيل الموعد")
// ------------------------------------------------------------
// (UserData.rescheduleAppointment is defined on the main UserData object
// and talks to appointments/reschedule_appointment.php)

function initRescheduleSystem() {
    // nothing to bind at load; modal is built on demand
}

function openRescheduleModal(appointmentId) {
    const appointments = UserData.getAppointments();
    const app = appointments.find(a => a.id === appointmentId);
    if (!app) return;

    const today = new Date().toISOString().split('T')[0];

    const modal = createMiniModal('reschedule-modal', `
        <h3><i class="fas fa-calendar-alt"></i> تأجيل الموعد</h3>
        <p class="mini-modal-sub">الموعد الحالي مع ${app.doctorName} — عدّل التاريخ والوقت الجديد</p>
        <form id="reschedule-form">
            <div class="form-group">
                <label>التاريخ الجديد</label>
                <input type="date" id="reschedule-date" min="${today}" required>
            </div>
            <div class="form-group">
                <label>الوقت الجديد</label>
                <select id="reschedule-time" required>
                    <option value="">اختر الوقت</option>
                    <option value="9am">9:00 صباحاً</option>
                    <option value="10am">10:00 صباحاً</option>
                    <option value="11am">11:00 صباحاً</option>
                    <option value="12pm">12:00 ظهراً</option>
                    <option value="2pm">2:00 مساءً</option>
                    <option value="3pm">3:00 مساءً</option>
                    <option value="4pm">4:00 مساءً</option>
                    <option value="5pm">5:00 مساءً</option>
                </select>
            </div>
            <button type="submit" class="mini-modal-submit"><i class="fas fa-check"></i> تأكيد التأجيل</button>
        </form>
    `);

    document.getElementById('reschedule-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const dateInput = document.getElementById('reschedule-date').value;
        const timeSelect = document.getElementById('reschedule-time');
        const timeLabel = timeSelect.options[timeSelect.selectedIndex].text;

        if (!dateInput || !timeSelect.value) return;

        const res = await UserData.rescheduleAppointment(appointmentId, dateInput, timeSelect.value, timeLabel);
        if (res.success) {
            showNotification('تم تأجيل الموعد بنجاح', 'success');
            loadUserAppointments();
            updateProfileStats();
            closeMiniModal('reschedule-modal');
        } else {
            showNotification(res.message || 'حدث خطأ أثناء تأجيل الموعد', 'error');
        }
    });
}

// ------------------------------------------------------------
// Helper: generic dynamic mini-modal builder (used by reschedule / review / payment)
// ------------------------------------------------------------
function createMiniModal(id, innerHtml) {
    let existing = document.getElementById(id);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = id;
    modal.innerHTML = `
        <div class="modal-content mini-modal-content">
            <span class="close-modal" onclick="closeMiniModal('${id}')">&times;</span>
            ${innerHtml}
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeMiniModal(id);
    });

    requestAnimationFrame(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    return modal;
}

function closeMiniModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 250);
}

// ------------------------------------------------------------
// 2) FLOATING WHATSAPP — pure HTML/CSS, no JS required
// ------------------------------------------------------------

// ------------------------------------------------------------
// 3) PATIENT REVIEW / RATING FORM
// ------------------------------------------------------------
function initReviewSystem() {
    // renders on demand via openReviewModal()
}

function openReviewModal() {
    const user = UserData.getCurrentUser();
    if (!user) {
        showNotification('يجب تسجيل الدخول أولاً لإرسال تقييم', 'error');
        openAuthModal();
        return;
    }
    const appointments = UserData.getAppointments();
    const doctorOptions = [...new Set(appointments.map(a => a.doctorName))];

    const modal = createMiniModal('review-modal', `
        <h3><i class="fas fa-star"></i> قيّم تجربتك معنا</h3>
        <p class="mini-modal-sub">رأيك يساعدنا على تقديم رعاية أفضل</p>
        <form id="review-form">
            <div class="star-rating-input" id="star-rating-input">
                <i class="far fa-star" data-value="1"></i>
                <i class="far fa-star" data-value="2"></i>
                <i class="far fa-star" data-value="3"></i>
                <i class="far fa-star" data-value="4"></i>
                <i class="far fa-star" data-value="5"></i>
            </div>
            <div class="form-group review-doctor-select">
                <label>الطبيب / القسم</label>
                ${doctorOptions.length ? `
                <select id="review-doctor">
                    <option value="عام - المستشفى">عام - المستشفى</option>
                    ${doctorOptions.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>` : `<input type="text" id="review-doctor" placeholder="اسم الطبيب أو القسم" value="عام - المستشفى">`}
            </div>
            <div class="form-group">
                <label>تعليقك</label>
                <textarea id="review-comment" rows="3" placeholder="شاركنا رأيك عن تجربتك..." required></textarea>
            </div>
            <button type="submit" class="mini-modal-submit"><i class="fas fa-paper-plane"></i> إرسال التقييم</button>
        </form>
    `);

    let selectedStars = 0;
    const stars = modal.querySelectorAll('.star-rating-input i');
    stars.forEach(star => {
        star.addEventListener('mouseenter', () => highlightStars(stars, star.dataset.value));
        star.addEventListener('click', () => {
            selectedStars = parseInt(star.dataset.value, 10);
            highlightStars(stars, selectedStars, true);
        });
    });
    modal.querySelector('.star-rating-input').addEventListener('mouseleave', () => {
        highlightStars(stars, selectedStars, true);
    });

    document.getElementById('review-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (selectedStars === 0) {
            showNotification('من فضلك اختر تقييم بالنجوم أولاً', 'error');
            return;
        }
        const doctorField = document.getElementById('review-doctor');
        const submitBtn = e.target.querySelector('.mini-modal-submit');
        submitBtn.disabled = true;

        const res = await API.submitReview({
            doctorName: doctorField ? doctorField.value : 'عام - المستشفى',
            rating: selectedStars,
            comment: document.getElementById('review-comment').value
        });

        submitBtn.disabled = false;

        if (res.success) {
            showNotification(res.message || 'شكراً لتقييمك! تم إرسال رأيك بنجاح', 'success');
            closeMiniModal('review-modal');
        } else {
            showNotification(res.message || 'حدث خطأ أثناء إرسال التقييم', 'error');
        }
    });
}

function highlightStars(stars, value, keepFilled) {
    stars.forEach(s => {
        const isActive = parseInt(s.dataset.value, 10) <= value;
        s.classList.toggle('active', isActive);
        s.classList.toggle('fas', isActive);
        s.classList.toggle('far', !isActive);
    });
}

// ------------------------------------------------------------
// 4) GLOBAL SITE SEARCH
// ------------------------------------------------------------
const SITE_SEARCH_INDEX = [
    { title: 'الصفحة الرئيسية', cat: 'صفحة', page: 'home', icon: 'fa-home' },
    { title: 'عن المستشفى', cat: 'صفحة', page: 'about', icon: 'fa-hospital' },
    { title: 'خدماتنا', cat: 'صفحة', page: 'services', icon: 'fa-stethoscope' },
    { title: 'فريق الأطباء', cat: 'صفحة', page: 'doctors', icon: 'fa-user-md' },
    { title: 'الأقسام الطبية', cat: 'صفحة', page: 'departments', icon: 'fa-layer-group' },
    { title: 'حجز موعد', cat: 'صفحة', page: 'appointments', icon: 'fa-calendar-check' },
    { title: 'تواصل معنا', cat: 'صفحة', page: 'contact', icon: 'fa-envelope' },
    { title: 'المدونة الصحية', cat: 'صفحة', page: 'blog', icon: 'fa-newspaper' },
    { title: 'الأسئلة الشائعة', cat: 'صفحة', page: 'faq', icon: 'fa-question-circle' },
    { title: 'التأمين والدفع', cat: 'صفحة', page: 'insurance', icon: 'fa-shield-alt' },
    { title: 'قلب وأوعية دموية', cat: 'تخصص', page: 'services', icon: 'fa-heartbeat' },
    { title: 'مخ وأعصاب', cat: 'تخصص', page: 'services', icon: 'fa-brain' },
    { title: 'عظام', cat: 'تخصص', page: 'services', icon: 'fa-bone' },
    { title: 'أطفال', cat: 'تخصص', page: 'services', icon: 'fa-baby' },
    { title: 'عيون', cat: 'تخصص', page: 'services', icon: 'fa-eye' },
    { title: 'أسنان', cat: 'تخصص', page: 'services', icon: 'fa-tooth' },
    { title: 'جلدية', cat: 'تخصص', page: 'services', icon: 'fa-allergies' },
    { title: 'أنف وأذن وحنجرة', cat: 'تخصص', page: 'services', icon: 'fa-head-side-cough' },
    { title: 'د. أحمد محمد - قلب', cat: 'طبيب', page: 'doctors', icon: 'fa-user-md' },
    { title: 'د. سارة أحمد - مخ وأعصاب', cat: 'طبيب', page: 'doctors', icon: 'fa-user-md' },
    { title: 'د. خالد العلي - عظام', cat: 'طبيب', page: 'doctors', icon: 'fa-user-md' },
    { title: 'د. نورا حسن - أطفال', cat: 'طبيب', page: 'doctors', icon: 'fa-user-md' },
    { title: 'د. ليلى سامي - عيون', cat: 'طبيب', page: 'doctors', icon: 'fa-user-md' },
    { title: 'د. محمود إبراهيم - قلب', cat: 'طبيب', page: 'doctors', icon: 'fa-user-md' },
    { title: 'قسم الطوارئ 24/7', cat: 'خدمة', page: 'home', icon: 'fa-ambulance', action: 'emergency' },
    { title: 'شركات التأمين المتعاقدة', cat: 'معلومات', page: 'insurance', icon: 'fa-shield-alt' },
    { title: 'طرق الدفع المتاحة', cat: 'معلومات', page: 'insurance', icon: 'fa-credit-card' }
];

function initSiteSearch() {
    const trigger = document.getElementById('search-trigger-btn');
    const panel = document.getElementById('site-search-panel');
    const input = document.getElementById('site-search-input');
    const closeBtn = document.getElementById('site-search-close');
    const resultsBox = document.getElementById('site-search-results');
    if (!trigger || !panel) return;

    function openPanel() {
        panel.classList.add('active');
        setTimeout(() => input.focus(), 50);
        renderSiteSearchResults('');
    }
    function closePanel() {
        panel.classList.remove('active');
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.contains('active') ? closePanel() : openPanel();
    });
    closeBtn.addEventListener('click', () => { input.value = ''; closePanel(); });
    panel.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== trigger) closePanel();
    });
    input.addEventListener('input', () => renderSiteSearchResults(input.value.trim()));

    // Single delegated listener on the results container, registered once.
    // Re-rendering results (innerHTML) no longer breaks clicks because we
    // never re-attach per-item listeners.
    resultsBox.addEventListener('click', (e) => {
        const el = e.target.closest('.site-search-result-item');
        if (!el) return;
        const action = el.getAttribute('data-action');
        const page = el.getAttribute('data-page');
        if (action === 'emergency') {
            const emModal = document.getElementById('emergency-modal');
            if (emModal) { emModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        } else if (page) {
            navigateToPage(page);
        }
        input.value = '';
        closePanel();
    });

    function renderSiteSearchResults(query) {
        // Don't dump the full list under the search box before the person
        // types anything — keep it clean with just a short hint.
        if (query.length === 0) {
            resultsBox.innerHTML = `<div class="site-search-hint">ابدأ الكتابة للبحث عن خدمة، طبيب، أو صفحة...</div>`;
            return;
        }
        const list = SITE_SEARCH_INDEX.filter(item => item.title.includes(query) || item.cat.includes(query));
        if (list.length === 0) {
            resultsBox.innerHTML = `<div class="site-search-empty">لا توجد نتائج مطابقة</div>`;
            return;
        }
        resultsBox.innerHTML = list.slice(0, 8).map(item => `
            <div class="site-search-result-item" data-page="${item.page}" data-action="${item.action || ''}">
                <i class="fas ${item.icon}"></i>
                <div><span class="sr-title">${item.title}</span><span class="sr-cat">${item.cat}</span></div>
            </div>
        `).join('');
    }
}

// ------------------------------------------------------------
// 5) ARABIC / ENGLISH LANGUAGE TOGGLE
// ------------------------------------------------------------
const AR_EN_DICTIONARY = {
    'الرئيسية': 'Home', 'عن المستشفى': 'About Us', 'خدماتنا': 'Services', 'الأطباء': 'Doctors',
    'الأقسام': 'Departments', 'الحجوزات': 'Appointments', 'تواصل معنا': 'Contact Us',
    'المدونة': 'Blog', 'الأسئلة الشائعة': 'FAQ', 'التأمين والدفع': 'Insurance & Payment',
    'مستشفى النخبة الطبية': 'Elite Care Hospital', 'تسجيل الدخول': 'Login',
    'خدمات طبية متكاملة': 'Comprehensive Medical Services', 'أفضل الأطباء المتخصصين': 'Our Top Specialist Doctors',
    'تخصصاتنا الطبية': 'Our Medical Departments', 'حجز موعد طبي': 'Book a Medical Appointment',
    'نحن هنا لمساعدتك': "We're Here to Help", 'فريقنا الطبي': 'Our Medical Team', 'أقسامنا': 'Our Departments',
    'احجز موعدك': 'Book Your Appointment',
    'نحن نؤمن بأن كل مريض يستحق أفضل رعاية': 'We believe every patient deserves the best care',
    'نقدم مجموعة واسعة من الخدمات الطبية المتخصصة بأحدث التقنيات': 'We offer a wide range of specialized medical services with the latest technology',
    'فريق طبي متميز بخبرات عالمية في مختلف التخصصات': 'An outstanding medical team with global expertise across specialties',
    'أقسام متخصصة تغطي جميع احتياجاتك الصحية': 'Specialized departments covering all your health needs',
    'احجز موعدك بسهولة في خطوات بسيطة': 'Book your appointment easily in simple steps',
    'لا تتردد في التواصل معنا لأي استفسار': "Don't hesitate to reach out with any inquiry",
    'من نحن': 'About Us', 'ماذا يقول مرضانا عنا': 'What Our Patients Say',
    'شهاداتنا واعتماداتنا': 'Our Certifications & Accreditations', 'رحلتنا عبر السنوات': 'Our Journey Over the Years',
    'آراء مرضانا': 'Patient Testimonials',
    'نقدم مجموعة واسعة من الخدمات الطبية المتخصصة': 'We offer a wide range of specialized medical services',
    'فريق طبي متميز بخبرات عالمية': 'An outstanding medical team with global expertise',
    'تجارب حقيقية من مرضى وثقوا برعايتنا الطبية': 'Real experiences from patients who trusted our care',
    'روابط سريعة': 'Quick Links', 'النشرة البريدية': 'Newsletter',
    'نقدم رعاية صحية متميزة بأحدث التقنيات العالمية وفريق طبي متخصص على مدار 24 ساعة.': 'We provide outstanding healthcare with the latest global technology and a specialized medical team around the clock.',
    'اشترك للحصول على آخر الأخبار والعروض الصحية': 'Subscribe to get the latest health news and offers',
    '© 2026 Elite Care Hospital. جميع الحقوق محفوظة.': '© 2026 Elite Care Hospital. All rights reserved.',
    'سياسة الخصوصية': 'Privacy Policy', 'شروط الاستخدام': 'Terms of Use', 'خريطة الموقع': 'Sitemap',
    'قلب وأوعية دموية': 'Cardiology', 'مخ وأعصاب': 'Neurology', 'جراحة العظام': 'Orthopedic Surgery',
    'طب الأطفال': 'Pediatrics', 'طب العيون': 'Ophthalmology',
    'البريد الإلكتروني': 'Email', 'كلمة المرور': 'Password', 'تذكرني': 'Remember me',
    'الاسم الأول': 'First Name', 'الاسم الأخير': 'Last Name', 'رقم الهاتف': 'Phone Number',
    'تأكيد كلمة المرور': 'Confirm Password', 'الاسم الكامل': 'Full Name', 'تاريخ الميلاد': 'Date of Birth',
    'التخصص المطلوب': 'Required Specialty', 'الطبيب': 'Doctor', 'التاريخ المفضل': 'Preferred Date',
    'الوقت المفضل': 'Preferred Time', 'ملاحظات إضافية': 'Additional Notes',
    'تأكيد الحجز': 'Confirm Booking', 'إرسال الرسالة': 'Send Message', 'إنشاء الحساب': 'Create Account',
    'إرسال رابط الاستعادة': 'Send Reset Link', 'طوارئ 24/7': '24/7 Emergency', 'طوارئ': 'Emergency'
};

function initLangToggle() {
    const btn = document.getElementById('lang-toggle-btn');
    if (!btn) return;
    const label = btn.querySelector('.lang-current');
    const savedLang = localStorage.getItem('elitecare_lang') || 'ar';
    applyLanguage(savedLang, label);

    btn.addEventListener('click', () => {
        const current = localStorage.getItem('elitecare_lang') || 'ar';
        const next = current === 'ar' ? 'en' : 'ar';
        localStorage.setItem('elitecare_lang', next);
        applyLanguage(next, label);
    });
}

function applyLanguage(lang, label) {
    const targets = document.querySelectorAll(
        '.nav-links a, .logo-sub, .page-hero-tag, .page-hero-content h1, .page-hero-content p, ' +
        '.section-tag, .section-title, .section-subtitle, .footer-col h4, .footer-links a, ' +
        '.footer-col > p, .footer-bottom p, .footer-bottom-links a, form label, .submit-btn, ' +
        '.login-btn span, #nav-user-text, .emergency-btn span, .floating-emergency span'
    );

    targets.forEach(el => {
        // Never touch elements that contain interactive/nested content (checkboxes,
        // links, inputs). Overwriting their textContent would silently delete that
        // content (e.g. it used to wipe out the "remember me" checkbox and the
        // terms-and-conditions links). Skip translating those entirely.
        if (el.querySelector('input, select, textarea, a')) return;

        if (!el.dataset.originalText) {
            el.dataset.originalText = el.textContent.trim();
        }
        const original = el.dataset.originalText;
        const newText = lang === 'en' ? (AR_EN_DICTIONARY[original] || original) : original;

        // Preserve any icon element (e.g. <i class="fas ...">) inside the label and
        // only update the text node, instead of wiping out all children.
        const hasIcon = el.querySelector('i');
        let textNode = null;
        el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) textNode = node;
        });
        if (textNode) {
            textNode.textContent = hasIcon ? ' ' + newText : newText;
        } else {
            el.appendChild(document.createTextNode((hasIcon ? ' ' : '') + newText));
        }
    });

    // Keep the RTL layout intact (cards/icons/spacing are built for RTL) and only
    // swap the translatable text + the lang attribute, so the design never breaks.
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
    document.body.classList.toggle('lang-en', lang === 'en');
    if (label) label.textContent = lang === 'en' ? 'AR' : 'EN';
}

// ------------------------------------------------------------
// 6) FAQ PAGE
// ------------------------------------------------------------
const FAQ_DATA = [
    { q: 'كيف يمكنني حجز موعد؟', a: 'يمكنك حجز موعد بسهولة من صفحة "الحجوزات" باختيار التخصص والطبيب والتاريخ المناسب، مع ضرورة تسجيل الدخول أولاً لحفظ بياناتك ومتابعة حالة الموعد.', cat: 'appointments' },
    { q: 'هل يمكنني تأجيل أو إلغاء موعدي؟', a: 'نعم، من صفحة "مواعيدي" داخل ملفك الشخصي يمكنك تأجيل الموعد لتاريخ ووقت جديدين، أو إلغاءه بالكامل في أي وقت قبل الموعد.', cat: 'appointments' },
    { q: 'كم من الوقت قبل الموعد يجب أن أصل؟', a: 'يُفضل الحضور قبل الموعد بـ 15-20 دقيقة لإتمام إجراءات التسجيل والاستقبال بسهولة.', cat: 'appointments' },
    { q: 'كيف أنشئ حساب جديد؟', a: 'اضغط على زر "تسجيل الدخول" أعلى الصفحة ثم اختر "إنشاء حساب جديد"، وأدخل بياناتك الأساسية، أو استخدم تسجيل الدخول السريع عبر جوجل أو فيسبوك.', cat: 'account' },
    { q: 'نسيت كلمة المرور، ماذا أفعل؟', a: 'اضغط على "نسيت كلمة المرور؟" في نافذة تسجيل الدخول وأدخل بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور.', cat: 'account' },
    { q: 'هل يمكنني رفع تقاريري وأشعتي الطبية؟', a: 'نعم، من تبويب "السجل الطبي" في ملفك الشخصي يمكنك رفع ملفات PDF أو صور لتقاريرك وأشعتك وحفظها بأمان على جهازك.', cat: 'account' },
    { q: 'ما هي شركات التأمين المتعاقد معها المستشفى؟', a: 'نتعامل مع عدد كبير من شركات التأمين المحلية والدولية، يمكنك الاطلاع على القائمة كاملة في صفحة "التأمين والدفع".', cat: 'payment' },
    { q: 'ما هي طرق الدفع المتاحة؟', a: 'نوفر الدفع النقدي في العيادة، الدفع بالبطاقات الائتمانية، المحافظ الإلكترونية، بالإضافة إلى واجهة دفع إلكتروني تجريبية عبر الموقع.', cat: 'payment' },
    { q: 'هل يمكنني معرفة تكلفة الكشف مقدماً؟', a: 'تختلف تكلفة الكشف حسب التخصص والطبيب، يمكنك التواصل مع قسم الاستعلامات على 19000 لمعرفة التفاصيل قبل الحجز.', cat: 'payment' },
    { q: 'هل خدمة الطوارئ متاحة على مدار الساعة؟', a: 'نعم، قسم الطوارئ يعمل 24 ساعة طوال أيام الأسبوع، ويمكنك التواصل مباشرة على الرقم 19001 في أي وقت.', cat: 'general' },
    { q: 'أين يقع المستشفى؟', a: 'يقع مستشفى النخبة الطبية في 123 شارع النخبة، القاهرة، مصر. يمكنك الحصول على الاتجاهات مباشرة من صفحة "الحجوزات".', cat: 'general' },
    { q: 'هل يمكنني التواصل معكم عبر واتساب؟', a: 'نعم، يمكنك الضغط على أيقونة واتساب العائمة أسفل يسار الشاشة للتواصل المباشر مع فريق خدمة العملاء.', cat: 'general' }
];

function initFAQPage() {
    const listEl = document.getElementById('faq-list');
    const emptyEl = document.getElementById('faq-empty');
    const searchInput = document.getElementById('faq-search-input');
    const catBtns = document.querySelectorAll('#faq-categories .faq-cat-btn');
    if (!listEl) return;

    let activeCat = 'all';

    function render() {
        const query = (searchInput.value || '').trim();
        const filtered = FAQ_DATA.filter(item => {
            const matchesCat = activeCat === 'all' || item.cat === activeCat;
            const matchesQuery = query === '' || item.q.includes(query) || item.a.includes(query);
            return matchesCat && matchesQuery;
        });

        emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
        listEl.innerHTML = filtered.map((item, i) => `
            <div class="faq-item" data-index="${i}">
                <div class="faq-question">
                    <h4>${item.q}</h4>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer"><p>${item.a}</p></div>
            </div>
        `).join('');

        listEl.querySelectorAll('.faq-item').forEach(item => {
            item.querySelector('.faq-question').addEventListener('click', () => {
                item.classList.toggle('open');
            });
        });
    }

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCat = btn.getAttribute('data-cat');
            render();
        });
    });

    searchInput.addEventListener('input', render);
    render();
}

// ------------------------------------------------------------
// 7) INSURANCE & PAYMENT INFO PAGE
// ------------------------------------------------------------
const INSURANCE_PARTNERS = [
    { name: 'ميدنت للتأمين الطبي', icon: 'fa-briefcase-medical' }, { name: 'ألليانز مصر', icon: 'fa-shield-alt' },
    { name: 'مصر للتأمين', icon: 'fa-hand-holding-medical' }, { name: 'AXA مصر', icon: 'fa-file-medical' },
    { name: 'بوبا مصر', icon: 'fa-heartbeat' }, { name: 'ميديكال ون', icon: 'fa-user-shield' },
    { name: 'جلوب مد', icon: 'fa-globe' }, { name: 'تأمين النيل', icon: 'fa-water' }
];

const PAYMENT_METHODS = [
    { icon: 'fa-money-bill-wave', title: 'الدفع النقدي', desc: 'ادفع نقداً مباشرة في عيادة الاستقبال عند زيارتك للمستشفى.' },
    { icon: 'fa-credit-card', title: 'البطاقات الائتمانية', desc: 'نقبل جميع بطاقات فيزا وماستركارد للدفع في العيادة أو إلكترونياً.' },
    { icon: 'fa-wallet', title: 'المحافظ الإلكترونية', desc: 'ادفع بسهولة عبر فودافون كاش وأورانج موني وباقي المحافظ الإلكترونية.' },
    { icon: 'fa-file-invoice-dollar', title: 'التحويل البنكي', desc: 'متاح للفواتير الكبيرة والعمليات الجراحية عبر التحويل البنكي المباشر.' }
];

function initInsurancePage() {
    const partnersGrid = document.getElementById('insurance-partners-grid');
    const methodsGrid = document.getElementById('payment-methods-grid');
    if (partnersGrid) {
        partnersGrid.innerHTML = INSURANCE_PARTNERS.map(p => `
            <div class="insurance-partner-card"><i class="fas ${p.icon}"></i><h4>${p.name}</h4><span>شريك معتمد</span></div>
        `).join('');
    }
    if (methodsGrid) {
        methodsGrid.innerHTML = PAYMENT_METHODS.map(m => `
            <div class="payment-method-card">
                <div class="pm-icon"><i class="fas ${m.icon}"></i></div>
                <div><h4>${m.title}</h4><p>${m.desc}</p></div>
            </div>
        `).join('');
    }
}

// ------------------------------------------------------------
// 8) ONLINE PAYMENT UI (demo only — no real payment gateway)
// ------------------------------------------------------------
function initPaymentSystem() {
    // opened on demand via openPaymentModal()
}

function openPaymentModal() {
    const modal = createMiniModal('payment-modal', `
        <h3><i class="fas fa-credit-card"></i> الدفع الإلكتروني</h3>
        <p class="mini-modal-sub">واجهة دفع تجريبية لأغراض العرض فقط</p>
        <div class="payment-card-preview">
            <i class="fab fa-cc-visa" style="font-size:1.8rem;"></i>
            <div class="payment-card-number" id="payment-card-number-preview">•••• •••• •••• ••••</div>
            <div class="payment-card-meta">
                <span id="payment-card-name-preview">CARD HOLDER</span>
                <span id="payment-card-exp-preview">MM/YY</span>
            </div>
        </div>
        <form id="payment-form">
            <div class="form-group">
                <label>اسم حامل البطاقة</label>
                <input type="text" id="payment-name" placeholder="Ahmed Mohamed" required>
            </div>
            <div class="form-group">
                <label>رقم البطاقة</label>
                <input type="text" id="payment-number" maxlength="19" placeholder="0000 0000 0000 0000" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>تاريخ الانتهاء</label>
                    <input type="text" id="payment-exp" maxlength="5" placeholder="MM/YY" required>
                </div>
                <div class="form-group">
                    <label>CVV</label>
                    <input type="text" id="payment-cvv" maxlength="4" placeholder="123" required>
                </div>
            </div>
            <div class="form-group">
                <label>المبلغ (جنيه)</label>
                <input type="number" id="payment-amount" placeholder="500" min="1" required>
            </div>
            <button type="submit" class="mini-modal-submit"><i class="fas fa-lock"></i> ادفع الآن</button>
            <p class="payment-security-note"><i class="fas fa-shield-alt"></i> عرض توضيحي — لا يتم إرسال أي بيانات حقيقية لأي بوابة دفع</p>
        </form>
    `);

    const nameInput = document.getElementById('payment-name');
    const numberInput = document.getElementById('payment-number');
    const expInput = document.getElementById('payment-exp');
    const namePreview = document.getElementById('payment-card-name-preview');
    const numberPreview = document.getElementById('payment-card-number-preview');
    const expPreview = document.getElementById('payment-card-exp-preview');

    nameInput.addEventListener('input', () => { namePreview.textContent = nameInput.value.toUpperCase() || 'CARD HOLDER'; });
    numberInput.addEventListener('input', () => {
        let digits = numberInput.value.replace(/\D/g, '').slice(0, 16);
        numberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
        numberPreview.textContent = numberInput.value || '•••• •••• •••• ••••';
    });
    expInput.addEventListener('input', () => {
        let digits = expInput.value.replace(/\D/g, '').slice(0, 4);
        if (digits.length > 2) digits = digits.slice(0, 2) + '/' + digits.slice(2);
        expInput.value = digits;
        expPreview.textContent = digits || 'MM/YY';
    });

    document.getElementById('payment-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const cardDigits = numberInput.value.replace(/\s/g, '');
        if (cardDigits.length < 16) {
            showNotification('رقم البطاقة غير مكتمل', 'error');
            return;
        }
        const amount = document.getElementById('payment-amount').value;
        const payments = JSON.parse(localStorage.getItem('elitecare_payments') || '[]');
        payments.unshift({
            id: Date.now(),
            amount,
            cardLast4: cardDigits.slice(-4),
            date: new Date().toISOString(),
            status: 'success'
        });
        localStorage.setItem('elitecare_payments', JSON.stringify(payments));

        document.querySelector('#payment-modal .mini-modal-content').innerHTML = `
            <span class="close-modal" onclick="closeMiniModal('payment-modal')">&times;</span>
            <div class="payment-success-box">
                <i class="fas fa-check-circle"></i>
                <h3>تمت عملية الدفع بنجاح</h3>
                <p>تم دفع ${amount} جنيه بنجاح ببطاقة تنتهي بـ ${cardDigits.slice(-4)}</p>
            </div>
        `;
        setTimeout(() => closeMiniModal('payment-modal'), 2500);
    });
}

// ------------------------------------------------------------
// 9) HEALTH BLOG / ARTICLES
// ------------------------------------------------------------
const BLOG_POSTS = [
    { id: 1, cat: 'heart', catLabel: 'قلب', title: '5 عادات يومية تحمي قلبك', excerpt: 'تعرف على أبسط العادات اليومية التي يمكنها تقليل خطر أمراض القلب بشكل كبير.', img: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80', author: 'د. أحمد محمد', readTime: '4 دقائق', content: 'المشي لمدة 30 دقيقة يومياً، تقليل الملح في الطعام، النوم الكافي، الابتعاد عن التدخين، والفحص الدوري لضغط الدم والكوليسترول من أهم العادات التي تحافظ على صحة القلب وتقلل من فرص الإصابة بالجلطات على المدى الطويل. ننصح دائماً بزيارة طبيب القلب سنوياً حتى مع عدم وجود أعراض ظاهرة.' },
    { id: 2, cat: 'nutrition', catLabel: 'تغذية', title: 'دليلك للتغذية السليمة في الصيف', excerpt: 'كيف تحافظ على نظام غذائي متوازن خلال فصل الصيف مع الحفاظ على مستويات الطاقة.', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80', author: 'فريق التغذية', readTime: '5 دقائق', content: 'يزداد احتياج الجسم للسوائل في الصيف، لذا ينصح بتناول الفواكه الغنية بالماء كالبطيخ والخيار، وتقليل الأطعمة الدسمة والمقلية، مع الحرص على تناول وجبات خفيفة متعددة بدلاً من وجبات دسمة كبيرة للحفاظ على مستوى الطاقة والتركيز طوال اليوم.' },
    { id: 3, cat: 'child', catLabel: 'أطفال', title: 'جدول تطعيمات الأطفال في السنة الأولى', excerpt: 'كل ما تحتاج معرفته عن مواعيد التطعيمات الأساسية لطفلك خلال العام الأول.', img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80', author: 'د. نورا حسن', readTime: '6 دقائق', content: 'يحتاج الطفل خلال عامه الأول إلى مجموعة من التطعيمات الأساسية وفقاً لجدول وزارة الصحة، تشمل تطعيمات الكبد الوبائي، الشلل، الثلاثي البكتيري، والحصبة. من المهم الالتزام بالمواعيد المحددة واستشارة طبيب الأطفال عند أي تأخير أو أعراض جانبية.' },
    { id: 4, cat: 'mental', catLabel: 'صحة نفسية', title: 'كيف تدير التوتر في حياتك اليومية', excerpt: 'استراتيجيات عملية للتعامل مع ضغوط الحياة اليومية والحفاظ على صحتك النفسية.', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', author: 'قسم الصحة النفسية', readTime: '4 دقائق', content: 'من أهم استراتيجيات إدارة التوتر تنظيم الوقت، ممارسة الرياضة بانتظام، تخصيص وقت يومي للاسترخاء، والتحدث مع شخص موثوق عند الشعور بالضغط. إذا استمر التوتر لفترة طويلة وأثر على حياتك اليومية، ننصح بطلب استشارة متخصص نفسي.' },
    { id: 5, cat: 'heart', catLabel: 'قلب', title: 'علامات تحذيرية لا يجب تجاهلها', excerpt: 'تعرف على الأعراض المبكرة التي قد تشير لمشكلة في القلب وتستدعي زيارة الطبيب فوراً.', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', author: 'د. محمود إبراهيم', readTime: '3 دقائق', content: 'ضيق التنفس المفاجئ، ألم أو ثقل في الصدر، خفقان غير منتظم، والتعب الشديد عند بذل مجهود بسيط، كلها علامات تستدعي استشارة طبيب القلب فوراً دون تأخير، خاصة إذا كانت مصحوبة بتاريخ عائلي لأمراض القلب.' },
    { id: 6, cat: 'nutrition', catLabel: 'تغذية', title: 'أطعمة تقوي جهاز المناعة', excerpt: 'قائمة بأهم الأطعمة الطبيعية التي تساعد على تقوية مناعة الجسم ضد الأمراض.', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80', author: 'فريق التغذية', readTime: '4 دقائق', content: 'الحمضيات الغنية بفيتامين سي، الثوم، الزنجبيل، اللبن الزبادي، والمكسرات كلها أطعمة تلعب دوراً مهماً في تقوية جهاز المناعة. يُنصح بدمجها ضمن النظام الغذائي اليومي مع النوم الكافي وممارسة الرياضة بانتظام.' }
];

function initBlogPage() {
    const grid = document.getElementById('blog-grid');
    const catBtns = document.querySelectorAll('#blog-categories .faq-cat-btn');
    if (!grid) return;

    function render(cat) {
        const filtered = cat === 'all' ? BLOG_POSTS : BLOG_POSTS.filter(p => p.cat === cat);
        grid.innerHTML = filtered.map(post => `
            <div class="blog-card" onclick="openBlogArticle(${post.id})">
                <div class="blog-card-img"><img src="${post.img}" alt="${post.title}" loading="lazy"></div>
                <div class="blog-card-body">
                    <span class="blog-card-tag">${post.catLabel}</span>
                    <h3>${post.title}</h3>
                    <p>${post.excerpt}</p>
                    <div class="blog-card-meta"><span><i class="fas fa-user-md"></i> ${post.author}</span><span><i class="fas fa-clock"></i> ${post.readTime}</span></div>
                </div>
            </div>
        `).join('');
    }

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render(btn.getAttribute('data-cat'));
        });
    });

    render('all');
}

function openBlogArticle(id) {
    const post = BLOG_POSTS.find(p => p.id === id);
    if (!post) return;
    const modal = document.getElementById('blog-article-modal');
    const content = document.getElementById('blog-article-content');
    content.innerHTML = `
        <div class="blog-article-body">
            <img src="${post.img}" alt="${post.title}">
            <span class="blog-card-tag">${post.catLabel}</span>
            <h2>${post.title}</h2>
            <div class="blog-article-meta"><span><i class="fas fa-user-md"></i> ${post.author}</span><span><i class="fas fa-clock"></i> ${post.readTime}</span></div>
            <p>${post.content}</p>
        </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ------------------------------------------------------------
// 10) SOCIAL LOGIN (Google / Facebook) — UI/local demo only
// ------------------------------------------------------------
function initSocialAuth() {
    // socialLogin() is called directly from buttons
}

function socialLogin(provider) {
    // Social login isn't wired to the backend (no Google/Facebook OAuth
    // endpoint in the PHP API), so rather than faking a logged-in state
    // that would fail on the very first protected request, we're honest
    // about it being unavailable for now.
    showNotification('تسجيل الدخول عبر ' + (provider === 'google' ? 'جوجل' : 'فيسبوك') + ' غير متاح حالياً، استخدم البريد الإلكتروني', 'error');
}

// ------------------------------------------------------------
// 11) MEDICAL FILE UPLOAD (local demo, no real server)
// ------------------------------------------------------------
function initMedicalUpload() {
    const uploadBtn = document.getElementById('medical-upload-btn');
    const fileInput = document.getElementById('medical-file-input');
    if (!uploadBtn || !fileInput) return;

    uploadBtn.addEventListener('click', () => {
        if (!Auth.isLoggedIn()) {
            showNotification('يجب تسجيل الدخول أولاً لرفع الملفات', 'error');
            openAuthModal();
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            showNotification('حجم الملف كبير جداً، الحد الأقصى 3 ميجابايت', 'error');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            const user = UserData.getCurrentUser();
            if (!user) return;
            const data = UserData.getLocalExtras(user.id);
            data.medicalFiles = data.medicalFiles || [];
            data.medicalFiles.unshift({
                id: Date.now(),
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result,
                uploadedAt: new Date().toISOString()
            });
            UserData.saveLocalExtras(user.id, data);
            renderMedicalFiles();
            showNotification('تم رفع الملف بنجاح', 'success');
            fileInput.value = '';
        };
        reader.onerror = function () {
            showNotification('حدث خطأ أثناء رفع الملف', 'error');
        };
        reader.readAsDataURL(file);
    });
}

function renderMedicalFiles() {
    const listEl = document.getElementById('medical-files-list');
    if (!listEl) return;
    const user = UserData.getCurrentUser();
    if (!user) { listEl.innerHTML = ''; return; }

    const data = UserData.getLocalExtras(user.id);
    const files = data.medicalFiles || [];

    if (files.length === 0) {
        listEl.innerHTML = '';
        return;
    }

    listEl.innerHTML = files.map(f => {
        const isImage = f.type && f.type.startsWith('image/');
        const dateStr = new Date(f.uploadedAt).toLocaleDateString('ar-EG');
        return `
            <div class="medical-file-card">
                <i class="fas ${isImage ? 'fa-file-image' : 'fa-file-pdf'} file-icon"></i>
                <div class="file-meta">
                    <span class="file-name">${f.name}</span>
                    <span class="file-date">${dateStr}</span>
                </div>
                <div class="file-actions">
                    <button class="view-file" onclick="viewMedicalFile(${f.id})" title="عرض"><i class="fas fa-eye"></i></button>
                    <button class="delete-file" onclick="deleteMedicalFile(${f.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function viewMedicalFile(id) {
    const user = UserData.getCurrentUser();
    if (!user) return;
    const data = UserData.getLocalExtras(user.id);
    const file = (data.medicalFiles || []).find(f => f.id === id);
    if (!file) return;
    const win = window.open();
    if (win) {
        win.document.write(file.type.startsWith('image/')
            ? `<img src="${file.data}" style="max-width:100%;">`
            : `<iframe src="${file.data}" style="width:100%;height:100vh;border:none;"></iframe>`);
    }
}

function deleteMedicalFile(id) {
    if (!confirm('هل تريد حذف هذا الملف؟')) return;
    const user = UserData.getCurrentUser();
    if (!user) return;
    const data = UserData.getLocalExtras(user.id);
    data.medicalFiles = (data.medicalFiles || []).filter(f => f.id !== id);
    UserData.saveLocalExtras(user.id, data);
    renderMedicalFiles();
    showNotification('تم حذف الملف', 'success');
}

// Render medical files whenever the medical-records tab is opened
document.addEventListener('DOMContentLoaded', function () {
    const medTabBtn = document.querySelector('.profile-nav-btn[data-tab="medical-records"]');
    if (medTabBtn) medTabBtn.addEventListener('click', renderMedicalFiles);
});

