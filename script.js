/**
 * Selfless Network - Application Logic & Controllers
 * Integrates database service layer, SPA routing, Map, Directory, Alerts, and Admin panels
 */

import { dbService, authService, currentDbMode, isUsingMock } from "./firebase.js";

// =========================================================================
// TAMIL NADU GEOGRAPHIC DISTRICT DATA
// =========================================================================
const TN_DATA = {
    "Chennai": ["Adyar", "Mylapore", "Guindy", "Tondiarpet", "Velachery", "Ambattur", "Mambalam", "Royapuram", "Egmore"],
    "Coimbatore": ["Coimbatore North", "Coimbatore South", "Pollachi", "Mettupalayam", "Valparai", "Sulur", "Annur"],
    "Madurai": ["Madurai North", "Madurai South", "Melur", "Thirumangalam", "Usilampatti", "Vadipatti", "Peraiyur"],
    "Trichy": ["Trichy East", "Trichy West", "Srirangam", "Lalgudi", "Manachanallur", "Thuraiyur", "Musiri"],
    "Salem": ["Salem South", "Salem North", "Attur", "Mettur", "Omalur", "Sankari", "Edappadi"],
    "Nilgiris": ["Udhagamandalam", "Coonoor", "Kotagiri", "Gudalur", "Kundah"],
    "Tiruvallur": ["Tiruvallur", "Avadi", "Ponneri", "Poonamallee", "Tiruttani", "Gummidipoondi"],
    "Kanchipuram": ["Kanchipuram", "Sriperumbudur", "Walajabad", "Kundrathur", "Uthiramerur"],
    "Chengalpattu": ["Chengalpattu", "Tambaram", "Pallavaram", "Madhuranthakam", "Tiruporur", "Cheyyur"],
    "Vellore": ["Vellore", "Katpadi", "Anaicut", "Gudiyatham", "Pernambut"],
    "Ranipet": ["Ranipet", "Arcot", "Arakkonam", "Walajah", "Nemili"],
    "Tirupathur": ["Tirupathur", "Vaniyambadi", "Ambur", "Natrampalli"],
    "Thiruvannamalai": ["Thiruvannamalai", "Arani", "Cheyyar", "Polur", "Chengam", "Vandavasi"],
    "Villupuram": ["Villupuram", "Tindivanam", "Gingee", "Vanur", "Marakkanam", "Vikravandi"],
    "Kallakurichi": ["Kallakurichi", "Sankarapuram", "Ulundurpet", "Chinnasalem", "Tirukkoilur"],
    "Cuddalore": ["Cuddalore", "Chidambaram", "Panruti", "Virudhachalam", "Neyveli", "Kurinjipadi"],
    "Krishnagiri": ["Krishnagiri", "Hosur", "Denkanikottai", "Pochampalli", "Uthangarai", "Shoolagiri"],
    "Dharmapuri": ["Dharmapuri", "Harur", "Pennagaram", "Palacode", "Pappireddipatti"],
    "Namakkal": ["Namakkal", "Rasipuram", "Tiruchengode", "Paramathi Velur", "Sendamangalam"],
    "Erode": ["Erode", "Gobichettipalayam", "Perundurai", "Bhavani", "Sathyamangalam", "Anthiyur"],
    "Tiruppur": ["Tiruppur North", "Tiruppur South", "Dharapuram", "Kangeyam", "Udumalpet", "Palladam"],
    "Karur": ["Karur", "Aravakurichi", "Kulithalai", "Krishnarayapuram", "Manmangalam"],
    "Perambalur": ["Perambalur", "Veppanthattai", "Alathur", "Kunnam"],
    "Ariyalur": ["Ariyalur", "Sendurai", "Udayarpalayam"],
    "Pudukkottai": ["Pudukkottai", "Aranthangi", "Alangudi", "Gandarvakottai", "Illuppur", "Karambakudi"],
    "Thanjavur": ["Thanjavur", "Kumbakonam", "Pattukkottai", "Orathanadu", "Thiruvaiyaru", "Papanasam"],
    "Tiruvarur": ["Tiruvarur", "Mannargudi", "Thiruthuraipoondi", "Nannilam", "Needamangalam"],
    "Nagapattinam": ["Nagapattinam", "Kilvelur", "Vedaranyam", "Thirukkuvalai"],
    "Mayiladuthurai": ["Mayiladuthurai", "Sirkazhi", "Kuthalam", "Tharangambadi"],
    "Dindigul": ["Dindigul West", "Dindigul East", "Palani", "Kodaikanal", "Natham", "Nilakottai"],
    "Theni": ["Theni", "Periyakulam", "Bodinayakanur", "Uthamapalayam", "Andipatti"],
    "Sivagangai": ["Sivagangai", "Karaikudi", "Devakottai", "Manamadurai", "Ilayangudi", "Tiruppathur"],
    "Ramanathapuram": ["Ramanathapuram", "Paramakudi", "Rameswaram", "Tiruvadanai", "Kadaladi"],
    "Virudhunagar": ["Virudhunagar", "Sivakasi", "Aruppukottai", "Srivilliputhur", "Rajapalayam", "Sathur"],
    "Tenkasi": ["Tenkasi", "Sankarankovil", "Sengottai", "Kadayanallur", "Alangulam", "Sivagiri"],
    "Tirunelveli": ["Tirunelveli", "Palayamkottai", "Ambasamudram", "Radhapuram", "Nanguneri"],
    "Thoothukudi": ["Thoothukudi", "Kovilpatti", "Tiruchendur", "Srivaikuntam", "Ettayapuram", "Ottapidaram"],
    "Kanyakumari": ["Nagercoil", "Kalkulam", "Agastheeswaram", "Thovalai", "Vilavancode"]
};

// =========================================================================
// APPLICATION STATE
// =========================================================================
let currentUser = null;
let currentVolunteerProfile = null;
let activeNotifications = [];
let unsubscribeNotifications = null;

// =========================================================================
// DOM CONTENT LOADED INITIALIZER
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // Hide Loader screen
    setTimeout(() => {
        const loader = document.getElementById("loader-overlay");
        loader.style.opacity = 0;
        setTimeout(() => loader.classList.add("hidden"), 500);
    }, 800);

    // Initial setup
    initAppRouting();
    initDarkMode();
    initTNDataDropdowns();
    initMapInteractions();
    initFAQAccordions();
    initAuthModal();
    initForms();

    // Listen to Firebase/Mock Authentication states
    authService.onAuthStateChanged(handleAuthStateChange);
    
    // Initial fetch of directory and stats
    refreshGlobalStats();
    loadVolunteerDirectory();
    loadHelpRequestsFeed();
    loadAlertsTimeline();

    // Setup Admin Dashboard menus
    initAdminNavigation();
    
    // Bind logo click to return to home
    document.getElementById("logo").addEventListener("click", () => {
        window.location.hash = "#home";
    });
});

// =========================================================================
// SPA ROUTER
// =========================================================================
const initAppRouting = () => {
    const handleRoute = () => {
        const hash = window.location.hash || "#home";
        const pageId = "page-" + hash.replace("#", "");
        
        const targetPage = document.getElementById(pageId);
        
        if (targetPage) {
            // Deactivate all pages
            document.querySelectorAll(".app-page").forEach(page => page.classList.remove("active"));
            // Activate target page
            targetPage.classList.add("active");
            
            // Highlight nav link
            document.querySelectorAll(".nav-link").forEach(link => {
                const linkPage = link.getAttribute("data-page");
                if (hash.includes(linkPage)) {
                    link.classList.add("active");
                } else {
                    link.classList.remove("active");
                }
            });
            
            // Scroll to top of section
            window.scrollTo({ top: 0, behavior: "smooth" });
            
            // Mobile navigation close on select
            const navMenu = document.getElementById("nav-menu");
            const navToggle = document.getElementById("nav-toggle");
            navMenu.classList.remove("active");
            navToggle.classList.remove("active");

            // If entering admin page, refresh dashboard data
            if (hash === "#admin" && currentUser && currentUser.role === "admin") {
                loadAdminDashboardData();
            }
        }
    };

    window.addEventListener("hashchange", handleRoute);
    handleRoute(); // Execute once on load

    // Mobile Hamburger button toggle
    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");
    if (navToggle && navMenu) {
        navToggle.addEventListener("click", () => {
            navToggle.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
    }
};

// =========================================================================
// DARK MODE CONTROLLER
// =========================================================================
const initDarkMode = () => {
    const toggleBtn = document.getElementById("dark-mode-toggle");
    
    // Read saved preference
    const isDark = localStorage.getItem("sn_dark_mode") === "true";
    if (isDark) {
        document.body.classList.add("dark");
        toggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: var(--color-warning);"></i>';
    }

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const activeDark = document.body.classList.contains("dark");
        localStorage.setItem("sn_dark_mode", activeDark);
        
        if (activeDark) {
            toggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: var(--color-warning);"></i>';
            showToast("Dark Mode Enabled", "Environmental mode activated.");
        } else {
            toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            showToast("Light Mode Enabled", "Warm daylight mode activated.");
        }
    });
};

// =========================================================================
// TAMIL NADU DATA INJECTION
// =========================================================================
const initTNDataDropdowns = () => {
    const districtSelects = [
        document.getElementById("vol-district"),
        document.getElementById("req-district"),
        document.getElementById("alert-district"),
        document.getElementById("filter-district")
    ];

    // Alphabetically sort district names
    const sortedDistricts = Object.keys(TN_DATA).sort();

    districtSelects.forEach(select => {
        if (!select) return;
        sortedDistricts.forEach(dist => {
            const opt = document.createElement("option");
            opt.value = dist;
            opt.textContent = dist;
            select.appendChild(opt);
        });
    });

    // Handle taluk dependencies dynamically
    const bindTalukDependency = (distSelectId, talukSelectId) => {
        const dSelect = document.getElementById(distSelectId);
        const tSelect = document.getElementById(talukSelectId);
        if (!dSelect || !tSelect) return;

        dSelect.addEventListener("change", () => {
            const district = dSelect.value;
            tSelect.innerHTML = ""; // Clear
            
            if (!district) {
                tSelect.disabled = true;
                const opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "Choose District first";
                tSelect.appendChild(opt);
                return;
            }

            tSelect.disabled = false;
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "Select Taluk";
            tSelect.appendChild(defaultOpt);

            const taluks = TN_DATA[district].sort();
            taluks.forEach(taluk => {
                const opt = document.createElement("option");
                opt.value = taluk;
                opt.textContent = taluk;
                tSelect.appendChild(opt);
            });
        });
    };

    bindTalukDependency("vol-district", "vol-taluk");
    bindTalukDependency("req-district", "req-taluk");
    bindTalukDependency("alert-district", "alert-taluk");
};

// =========================================================================
// INTERACTIVE MAP CONTROLLER
// =========================================================================
const initMapInteractions = () => {
    const mapPaths = document.querySelectorAll(".district-path");
    const mapFilterBtn = document.getElementById("map-filter-btn");
    let selectedDistrict = "";

    mapPaths.forEach(path => {
        path.addEventListener("click", async () => {
            // Toggle active classes
            mapPaths.forEach(p => p.classList.remove("active"));
            path.classList.add("active");

            const districtName = path.getAttribute("data-name");
            selectedDistrict = districtName;
            
            // Update panel details
            document.getElementById("map-district-name").textContent = districtName;
            
            // Show loaders in numbers
            document.getElementById("map-vol-count").textContent = "Analyzing...";
            document.getElementById("map-req-count").textContent = "Analyzing...";
            document.getElementById("map-alert-count").textContent = "Analyzing...";

            // Retrieve live stats for this district
            try {
                const vols = await dbService.volunteers.getAll();
                const reqs = await dbService.helpRequests.getAll();
                const alerts = await dbService.alerts.getAll();

                const districtVols = vols.filter(v => v.district === districtName && v.status === "approved").length;
                const districtReqs = reqs.filter(r => r.district === districtName && r.status === "active").length;
                const districtAlerts = alerts.filter(a => a.district === districtName && a.verified === true).length;

                document.getElementById("map-vol-count").textContent = `${districtVols} Volunteers`;
                document.getElementById("map-req-count").textContent = `${districtReqs} Active Requests`;
                document.getElementById("map-alert-count").textContent = `${districtAlerts} Verified Alerts`;
                
                mapFilterBtn.disabled = false;
                mapFilterBtn.textContent = `View Volunteers in ${districtName}`;
            } catch (err) {
                console.error("Map query failure", err);
            }
        });
    });

    // Clicking Search on map info redirects to directory
    mapFilterBtn.addEventListener("click", () => {
        if (!selectedDistrict) return;
        
        // Populate directory filter & submit
        document.getElementById("filter-district").value = selectedDistrict;
        window.location.hash = "#directory";
        
        // Trigger directory search
        loadVolunteerDirectory({ district: selectedDistrict });
    });
};

// =========================================================================
// FAQ ACCORDIONS
// =========================================================================
const initFAQAccordions = () => {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        question.addEventListener("click", () => {
            // Close others
            faqItems.forEach(i => {
                if (i !== item) i.classList.remove("active");
            });
            item.classList.toggle("active");
        });
    });
};

// =========================================================================
// AUTHENTICATION MODAL CONTROLLER
// =========================================================================
const initAuthModal = () => {
    const authBtn = document.getElementById("auth-btn");
    const authModal = document.getElementById("auth-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const loginTab = document.getElementById("tab-login-btn");
    const signupTab = document.getElementById("tab-signup-btn");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    
    // Switch tabs
    const setModalView = (view) => {
        if (view === "login") {
            loginTab.classList.add("active");
            signupTab.classList.remove("active");
            loginForm.classList.add("active");
            signupForm.classList.remove("active");
        } else {
            loginTab.classList.remove("active");
            signupTab.classList.add("active");
            loginForm.classList.remove("active");
            signupForm.classList.add("active");
        }
    };

    authBtn.addEventListener("click", () => {
        if (currentUser) {
            // Log out user
            authService.logOut().then(() => {
                showToast("Logged Out", "You have signed out of Selfless Network.");
            }).catch(e => {
                showToast("Error", "Logout failed: " + e.message, "danger");
            });
        } else {
            authModal.classList.add("active");
            setModalView("login");
        }
    });

    closeModalBtn.addEventListener("click", () => authModal.classList.remove("active"));
    
    // Click outside to close
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) authModal.classList.remove("active");
    });

    loginTab.addEventListener("click", () => setModalView("login"));
    signupTab.addEventListener("click", () => setModalView("signup"));
    
    document.getElementById("go-to-signup").addEventListener("click", (e) => {
        e.preventDefault();
        setModalView("signup");
    });
    
    document.getElementById("go-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        setModalView("login");
    });

    // Handle Forgot Password
    document.getElementById("forgot-password-link").addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        if (!email) {
            showToast("Forgot Password", "Please type your email address first.", "warning");
            return;
        }
        authService.resetPassword(email).then((msg) => {
            showToast("Password Reset", msg);
        }).catch(e => {
            showToast("Error", e.message, "danger");
        });
    });
};

// =========================================================================
// HANDLE AUTH STATE CHANGES
// =========================================================================
const handleAuthStateChange = async (user) => {
    const authBtnText = document.getElementById("auth-btn-text");
    const authBtnIcon = document.querySelector("#auth-btn i");
    const authModal = document.getElementById("auth-modal");
    const volRegForm = document.getElementById("volunteer-registration-form");
    
    currentUser = user;
    authModal.classList.remove("active");

    if (user) {
        // Logged In
        authBtnText.textContent = user.name || user.email.split("@")[0];
        authBtnIcon.className = "fa-solid fa-sign-out-alt";
        
        // Auto-fill forms
        const volEmail = document.getElementById("vol-email");
        if (volEmail) volEmail.value = user.email;
        
        const volFullName = document.getElementById("vol-fullname");
        if (volFullName && !volFullName.value) volFullName.value = user.name || "";

        // Check if user is a volunteer and retrieve their district profile
        try {
            const volunteersList = await dbService.volunteers.getAll();
            currentVolunteerProfile = volunteersList.find(v => v.email.toLowerCase() === user.email.toLowerCase());
            
            if (currentVolunteerProfile && currentVolunteerProfile.status === "approved") {
                // Subscribe to alerts/requests in their district
                subscribeToDistrictNotifications(currentVolunteerProfile.district);
                document.getElementById("current-notif-district").textContent = `Region: ${currentVolunteerProfile.district}`;
            } else {
                subscribeToDistrictNotifications("all");
                document.getElementById("current-notif-district").textContent = `Region: All (Guest)`;
            }
        } catch (e) {
            console.error("Failed querying volunteer profile", e);
        }

        // Show Admin Nav Link if user is admin
        const adminLinks = [
            document.querySelector('.nav-link[data-page="admin"]'),
            document.getElementById("footer-admin-link")
        ];
        
        if (user.role === "admin") {
            // Add nav tab dynamically if not exists
            if (!document.querySelector('.nav-link[data-page="admin"]')) {
                const adminTab = document.createElement("a");
                adminTab.href = "#admin";
                adminTab.className = "nav-link";
                adminTab.setAttribute("data-page", "admin");
                adminTab.textContent = "Admin Panel";
                document.getElementById("nav-menu").appendChild(adminTab);
                
                // Re-bind routing
                initAppRouting();
            }
            showToast("Welcome Admin", "System Management Dashboards enabled.");
        } else {
            // Remove admin link if it exists
            const existingAdmin = document.querySelector('.nav-link[data-page="admin"]');
            if (existingAdmin) existingAdmin.remove();
        }
        
    } else {
        // Logged Out
        authBtnText.textContent = "Join / Log In";
        authBtnIcon.className = "fa-solid fa-user-plus";
        currentVolunteerProfile = null;
        
        // Remove admin tab link
        const existingAdmin = document.querySelector('.nav-link[data-page="admin"]');
        if (existingAdmin) existingAdmin.remove();

        // Clear notification listeners
        if (unsubscribeNotifications) {
            unsubscribeNotifications();
            unsubscribeNotifications = null;
        }

        document.getElementById("current-notif-district").textContent = `Region: Not Logged In`;
        document.getElementById("notif-count").classList.add("hidden");
    }
};

// =========================================================================
// REAL-TIME NOTIFICATION HANDLERS
// =========================================================================
const subscribeToDistrictNotifications = (district) => {
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
    }

    const bellBtn = document.getElementById("notif-btn");
    const notifCountBadge = document.getElementById("notif-count");
    
    // Fetch initial district notifications
    dbService.notifications.getForUser(district).then(list => {
        activeNotifications = list;
        updateNotificationCenter();
    });

    // Subscribe to new real-time notifications
    unsubscribeNotifications = dbService.notifications.onNewNotification(district, (newNotif) => {
        // Prevent duplicate loads
        if (activeNotifications.find(n => n.id === newNotif.id)) return;
        
        activeNotifications.unshift(newNotif);
        
        // Ring bell animation
        bellBtn.classList.add("shake-bell");
        setTimeout(() => bellBtn.classList.remove("shake-bell"), 500);

        // Toast notification
        showToast(newNotif.title, newNotif.message, newNotif.type === "alert" ? "warning" : "info");
        
        updateNotificationCenter();
    });
};

const updateNotificationCenter = () => {
    const notifCountBadge = document.getElementById("notif-count");
    const dropdownBody = document.getElementById("notif-dropdown-body");
    
    const unreadCount = activeNotifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notifCountBadge.textContent = unreadCount;
        notifCountBadge.classList.remove("hidden");
    } else {
        notifCountBadge.classList.add("hidden");
    }

    dropdownBody.innerHTML = "";
    if (activeNotifications.length === 0) {
        dropdownBody.innerHTML = `
            <div class="dropdown-item text-center" style="color: var(--color-text-muted); font-size: 13px; padding: 24px;">
                No notifications in your district.
            </div>`;
        return;
    }

    activeNotifications.forEach(notif => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        
        const timestamp = new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        item.innerHTML = `
            <div class="dropdown-item-dot ${notif.read ? 'hidden' : ''}"></div>
            <div class="dropdown-item-content">
                <h5>${notif.title}</h5>
                <p>${notif.message}</p>
                <span>${timestamp}</span>
            </div>
        `;
        
        item.addEventListener("click", () => {
            notif.read = true;
            updateNotificationCenter();
            
            // Redirect to appropriate section
            if (notif.type === "request") {
                window.location.hash = "#request-help";
            } else if (notif.type === "alert") {
                window.location.hash = "#alerts";
            }
        });

        dropdownBody.appendChild(item);
    });
};

// Toggle notification center visibility
document.getElementById("notif-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("notification-dropdown").classList.toggle("active");
});

document.addEventListener("click", () => {
    document.getElementById("notification-dropdown").classList.remove("active");
});

document.getElementById("notification-dropdown").addEventListener("click", (e) => e.stopPropagation());

document.getElementById("mark-all-read").addEventListener("click", () => {
    activeNotifications.forEach(n => n.read = true);
    updateNotificationCenter();
});

// =========================================================================
// COUNTER ANIMATIONS FOR STATISTICS
// =========================================================================
const animateCounters = () => {
    const animate = (elem) => {
        const target = +elem.getAttribute("data-target");
        let current = 0;
        const increment = Math.ceil(target / 80); // Speed factor
        
        const update = () => {
            current += increment;
            if (current >= target) {
                elem.textContent = target + (target > 50 ? "+" : "");
            } else {
                elem.textContent = current;
                requestAnimationFrame(update);
            }
        };
        update();
    };

    document.querySelectorAll(".stat-number").forEach(animate);
};

const refreshGlobalStats = async () => {
    try {
        const stats = await dbService.stats.getCounts();
        
        const vCount = document.getElementById("stat-volunteers");
        const dCount = document.getElementById("stat-districts");
        const rCount = document.getElementById("stat-requests");
        const sCount = document.getElementById("stat-supports");

        vCount.setAttribute("data-target", stats.volunteers);
        dCount.setAttribute("data-target", stats.districts);
        rCount.setAttribute("data-target", stats.activeRequests);
        sCount.setAttribute("data-target", stats.successfulSupports);

        animateCounters();
    } catch (err) {
        console.error("Could not fetch global counts", err);
    }
};

// =========================================================================
// FORM CONTROLLERS
// =========================================================================
const initForms = () => {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const volRegForm = document.getElementById("volunteer-registration-form");
    const helpReqForm = document.getElementById("help-request-form");
    const communityAlertForm = document.getElementById("community-alert-form");
    const contactForm = document.getElementById("general-contact-form");

    // AUTH: Login submit
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const pass = document.getElementById("login-password").value;

        authService.logIn(email, pass).then(user => {
            showToast(`Welcome Back`, `Logged in successfully as ${user.name}`);
        }).catch(err => {
            showToast("Login Failed", err.message, "danger");
        });
    });

    // AUTH: Signup submit
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("signup-name").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const pass = document.getElementById("signup-password").value;
        const role = document.getElementById("signup-role").value;

        authService.signUp(email, pass, name, role).then(user => {
            showToast(`Registration Successful`, `Account created. Welcome ${user.name}!`);
        }).catch(err => {
            showToast("Signup Failed", err.message, "danger");
        });
    });

    // VOLUNTEER REGISTRATION
    volRegForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            showToast("Access Denied", "Please Log In or Sign Up first to register as a volunteer.", "warning");
            document.getElementById("auth-modal").classList.add("active");
            return;
        }

        const name = document.getElementById("vol-fullname").value.trim();
        const age = parseInt(document.getElementById("vol-age").value);
        const gender = document.getElementById("vol-gender").value;
        const phone = document.getElementById("vol-phone").value.trim();
        const email = document.getElementById("vol-email").value.trim();
        const district = document.getElementById("vol-district").value;
        const taluk = document.getElementById("vol-taluk").value;
        const village = document.getElementById("vol-village").value.trim();
        const emergencyContact = document.getElementById("vol-emergency").value.trim();
        const intro = document.getElementById("vol-intro").value.trim();
        
        // Arrays multiselect checkboxes
        const languages = Array.from(document.querySelectorAll('input[name="vol-lang"]:checked')).map(cb => cb.value);
        const availability = Array.from(document.querySelectorAll('input[name="vol-days"]:checked')).map(cb => cb.value);
        const skills = Array.from(document.querySelectorAll('input[name="vol-skills"]:checked')).map(cb => cb.value);
        const sharePublicly = document.getElementById("vol-share-public").checked;

        if (skills.length === 0 || languages.length === 0 || availability.length === 0) {
            showToast("Validation Error", "Please choose at least one skill, language, and available day.", "warning");
            return;
        }

        const volData = {
            userId: currentUser.id,
            name, age, gender, phone, email, district, taluk, village, 
            emergencyContact, languages, availability, skills, intro, sharePublicly
        };

        dbService.volunteers.register(volData).then(() => {
            showToast("Registered Successfully", "Your profile is pending admin approval.", "warning");
            volRegForm.reset();
            window.location.hash = "#home";
            refreshGlobalStats();
        }).catch(err => {
            showToast("Registration Failed", err.message, "danger");
        });
    });

    // HELP REQUESTS FORM
    helpReqForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("req-name").value.trim();
        const contact = document.getElementById("req-contact").value.trim();
        const district = document.getElementById("req-district").value;
        const taluk = document.getElementById("req-taluk").value;
        const location = document.getElementById("req-location").value.trim();
        const category = document.getElementById("req-category").value;
        const urgency = document.getElementById("req-urgency").value;
        const description = document.getElementById("req-desc").value.trim();
        const imageFile = document.getElementById("req-image").files[0];

        const submitRequest = (imgData = null) => {
            const reqData = {
                name, contact, district, taluk, location, category, urgency, description,
                image: imgData
            };

            dbService.helpRequests.create(reqData).then(() => {
                showToast("Request Submitted", "Help alert sent to nearby district volunteers!");
                helpReqForm.reset();
                // Disable taluk select again until district selected
                document.getElementById("req-taluk").disabled = true;
                
                loadHelpRequestsFeed();
                refreshGlobalStats();
            }).catch(e => {
                showToast("Submission Failed", e.message, "danger");
            });
        };

        // File compression base64 converter
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                submitRequest(event.target.result); // Base64 encoding
            };
            reader.readAsDataURL(imageFile);
        } else {
            submitRequest();
        }
    });

    // COMMUNITY ALERT SUBMISSION FORM
    communityAlertForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = document.getElementById("alert-title").value.trim();
        const category = document.getElementById("alert-category").value;
        const district = document.getElementById("alert-district").value;
        const taluk = document.getElementById("alert-taluk").value;
        const location = document.getElementById("alert-location").value.trim();
        const description = document.getElementById("alert-desc").value.trim();

        const alertData = {
            title, category, district, taluk, location, description,
            submittedBy: currentUser ? (currentUser.name || currentUser.email) : "Anonymous Public",
            date: new Date().toISOString()
        };

        dbService.alerts.create(alertData).then(() => {
            showToast("Alert Submitted", "Pending admin verification before broadcasting.", "warning");
            communityAlertForm.reset();
            // Disable taluk select again
            document.getElementById("alert-taluk").disabled = true;
        }).catch(err => {
            showToast("Alert Failed", err.message, "danger");
        });
    });

    // GENERAL CONTACT FEEDBACK
    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("Feedback Sent", "Thank you for contacting us. We will get back to you soon!");
        contactForm.reset();
    });
};

// =========================================================================
// VOLUNTEER DIRECTORY CARD RENDERER
// =========================================================================
const loadVolunteerDirectory = async (filters = null) => {
    const listWrapper = document.getElementById("directory-volunteers-list");
    if (!listWrapper) return;

    listWrapper.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: var(--color-primary);"></i>
            <p style="margin-top: 10px;">Loading volunteer base...</p>
        </div>`;

    try {
        const allVols = await dbService.volunteers.getAll();
        
        // Parse active filter options
        const fDist = filters && filters.district ? filters.district : document.getElementById("filter-district").value;
        const fTaluk = filters && filters.taluk ? filters.taluk.toLowerCase() : document.getElementById("filter-taluk").value.toLowerCase();
        const fSkill = filters && filters.skill ? filters.skill : document.getElementById("filter-skill").value;

        // Apply filters (only show status approved and public profiles)
        const filteredVols = allVols.filter(vol => {
            if (vol.status !== "approved" || !vol.sharePublicly) return false;
            if (fDist && vol.district !== fDist) return false;
            if (fTaluk && !vol.taluk.toLowerCase().includes(fTaluk)) return false;
            if (fSkill && !vol.skills.includes(fSkill)) return false;
            return true;
        });

        listWrapper.innerHTML = "";
        
        if (filteredVols.length === 0) {
            listWrapper.innerHTML = `
                <div class="empty-directory-state">
                    <i class="fa-solid fa-people-carry-box"></i>
                    <h4>No Volunteers Found</h4>
                    <p>Try clearing filters or check another district.</p>
                </div>`;
            return;
        }

        filteredVols.forEach(vol => {
            const card = document.createElement("div");
            card.className = "volunteer-card";

            const skillsHtml = vol.skills.map(s => `<span class="skill-tag">${s}</span>`).join("");
            const availHtml = vol.availability.join(", ");

            card.innerHTML = `
                <div class="card-header-badge">
                    <div style="font-weight: 700; color: var(--color-text-primary);"><i class="fa-solid fa-user"></i> Volunteer</div>
                    <span class="card-status status-approved">${vol.district}</span>
                </div>
                <div class="card-body">
                    <h4 class="card-title">${vol.name}</h4>
                    <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${vol.taluk || ''}, ${vol.village || ''}</div>
                    <p class="card-intro">${vol.intro || "Dedicated volunteer ready to assist during emergencies."}</p>
                    
                    <div style="font-weight: 600; font-size: 13px; margin-top: 5px;">Skills:</div>
                    <div class="card-skills">${skillsHtml}</div>
                    
                    <div class="card-availability">
                        <i class="fa-solid fa-calendar-days"></i>
                        <span><strong>Days:</strong> ${availHtml}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-block btn-sm contact-vol-btn" data-phone="${vol.phone}" data-name="${vol.name}">
                        <i class="fa-solid fa-envelope"></i> Contact Volunteer
                    </button>
                </div>
            `;

            listWrapper.appendChild(card);
        });

        // Click handler for anonymous security check contact
        document.querySelectorAll(".contact-vol-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (!currentUser) {
                    showToast("Access Restricted", "Please Log In to contact volunteers.", "warning");
                    document.getElementById("auth-modal").classList.add("active");
                    return;
                }
                const phone = btn.getAttribute("data-phone");
                const name = btn.getAttribute("data-name");
                
                // Secure contact reveal
                alert(`Security Note:\n\nYou are contacting ${name}.\nContact Phone Number: ${phone}\n\nPlease communicate responsibly and respect their schedule.`);
            });
        });

    } catch (e) {
        listWrapper.innerHTML = `<div class="empty-directory-state"><p>Error retrieving profiles. Try reloading.</p></div>`;
        console.error("Directory fetch crash", e);
    }
};

// Bind filter searches
document.getElementById("btn-search-directory").addEventListener("click", () => {
    loadVolunteerDirectory();
});

// =========================================================================
// HELP REQUEST CARD RENDERER
// =========================================================================
const loadHelpRequestsFeed = async () => {
    const feed = document.getElementById("active-requests-feed");
    if (!feed) return;

    feed.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 30px; color: var(--color-accent);"></i>
            <p style="margin-top: 10px;">Refreshing active requests...</p>
        </div>`;

    try {
        const allRequests = await dbService.helpRequests.getAll();
        
        // Filter only active ones, sorted descending
        const activeRequests = allRequests
            .filter(r => r.status === "active")
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        feed.innerHTML = "";

        if (activeRequests.length === 0) {
            feed.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-muted);">
                    <i class="fa-solid fa-square-check" style="font-size: 40px; color: var(--color-primary); margin-bottom: 12px;"></i>
                    <h4>No Active Requests</h4>
                    <p>All requested support tickets have been resolved. Excellent work!</p>
                </div>`;
            return;
        }

        activeRequests.forEach(req => {
            const card = document.createElement("div");
            card.className = "request-card";
            
            const timestamp = new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            card.innerHTML = `
                <div class="urgency-stripe urgency-${req.urgency}"></div>
                <div class="request-meta-header">
                    <span class="urgency-badge ${req.urgency}">${req.urgency} Urgency</span>
                    <span class="req-date">${timestamp}</span>
                </div>
                <div class="request-card-body">
                    <span class="req-category">${req.category}</span>
                    <h4 style="margin: 4px 0 8px;">Request by ${req.name}</h4>
                    <p class="req-desc">${req.description}</p>
                    
                    <div class="req-details-grid">
                        <div class="req-detail-item"><i class="fa-solid fa-location-dot"></i> <span>${req.taluk || ''}, ${req.district}</span></div>
                        <div class="req-detail-item"><i class="fa-solid fa-map-pin"></i> <span>${req.location}</span></div>
                    </div>

                    ${req.image ? `
                        <div style="margin-top:10px;">
                            <img src="${req.image}" alt="Request image verification" style="width:100%; max-height:180px; object-fit:cover; border-radius: var(--border-radius-sm);">
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer" style="padding: 16px 24px;">
                    <button class="btn btn-accent btn-block btn-sm offer-help-btn" data-phone="${req.contact}" data-name="${req.name}">
                        <i class="fa-solid fa-headset"></i> Offer Support
                    </button>
                </div>
            `;

            feed.appendChild(card);
        });

        // Support offer button reveal details
        document.querySelectorAll(".offer-help-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (!currentUser) {
                    showToast("Access Restricted", "Please Log In to view coordinates and coordinate help.", "warning");
                    document.getElementById("auth-modal").classList.add("active");
                    return;
                }
                const name = btn.getAttribute("data-name");
                const phone = btn.getAttribute("data-phone");
                
                alert(`Offer Support:\n\nYou are offering help to ${name}.\nPlease contact them at: ${phone} to coordinate assistance.\n\nKeep notes safe and update admins once resolved!`);
            });
        });

    } catch (e) {
        feed.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--color-danger); padding:20px;">Could not reload feed.</div>`;
        console.error("Help Request load crash", e);
    }
};

// =========================================================================
// COMMUNITY ALERTS TIMELINE RENDERER
// =========================================================================
const loadAlertsTimeline = async () => {
    const container = document.getElementById("alerts-timeline-container");
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:30px; color: var(--color-primary);"></i></div>`;

    try {
        const allAlerts = await dbService.alerts.getAll();
        
        // Show only verified alerts to the public
        const displayAlerts = allAlerts.filter(a => a.verified === true);
        
        container.innerHTML = "";

        if (displayAlerts.length === 0) {
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: var(--color-text-muted);">
                    <i class="fa-solid fa-sheet-plastic" style="font-size:36px; margin-bottom: 12px;"></i>
                    <p>No verified community alerts currently active on the timeline.</p>
                </div>`;
            return;
        }

        displayAlerts.forEach(alert => {
            const item = document.createElement("div");
            item.className = "alert-timeline-item verified";

            const timestamp = new Date(alert.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            item.innerHTML = `
                <div class="alert-node-card">
                    <div class="alert-header">
                        <div class="alert-title-block">
                            <span class="alert-badge verified" style="margin-bottom: 6px; display:inline-block;"><i class="fa-solid fa-shield-check"></i> ${alert.category}</span>
                            <h4>${alert.title}</h4>
                        </div>
                    </div>
                    <p class="alert-content">${alert.description}</p>
                    <div class="alert-footer-info">
                        <span><i class="fa-solid fa-location-dot"></i> ${alert.location}, ${alert.district}</span>
                        <span><i class="fa-solid fa-user-pen"></i> By: ${alert.submittedBy}</span>
                        <span><i class="fa-regular fa-clock"></i> ${timestamp}</span>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });

    } catch (e) {
        container.innerHTML = `<div style="color:var(--color-danger); text-align:center;">Failed to load alerts.</div>`;
        console.error("Alerts render crash", e);
    }
};

// =========================================================================
// ADMIN CONTROL PANEL CONTROLLERS
// =========================================================================
const initAdminNavigation = () => {
    const tabs = document.querySelectorAll(".admin-menu-link");
    const views = document.querySelectorAll(".admin-dashboard-view");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const tabName = tab.getAttribute("data-tab");
            views.forEach(v => {
                if (v.id === `admin-view-${tabName}`) {
                    v.classList.add("active");
                } else {
                    v.classList.remove("active");
                }
            });
        });
    });
};

const loadAdminDashboardData = async () => {
    if (!currentUser || currentUser.role !== "admin") return;

    try {
        const vols = await dbService.volunteers.getAll();
        const reqs = await dbService.helpRequests.getAll();
        const alerts = await dbService.alerts.getAll();

        // 1. Dashboard summary counters
        const approvedVols = vols.filter(v => v.status === "approved").length;
        const activeReqs = reqs.filter(r => r.status === "active").length;
        const totalAlerts = alerts.length;

        document.getElementById("admin-stat-vols-count").textContent = approvedVols;
        document.getElementById("admin-stat-reqs-count").textContent = activeReqs;
        document.getElementById("admin-stat-alerts-count").textContent = totalAlerts;

        // 2. Render Live Activity Audit Trail
        const logBody = document.getElementById("admin-activity-log-body");
        logBody.innerHTML = "";
        
        // Merge activities for chronological audit log
        const activities = [];
        vols.forEach(v => activities.push({ time: new Date(v.createdAt), type: "Volunteer Reg", desc: `${v.name} registered`, loc: v.district, status: v.status }));
        reqs.forEach(r => activities.push({ time: new Date(r.createdAt), type: "Help Request", desc: `${r.category} submitted`, loc: r.district, status: r.status }));
        alerts.forEach(a => activities.push({ time: new Date(a.createdAt), type: "Alert Submitted", desc: `${a.title} posted`, loc: a.district, status: a.verified ? "verified" : "pending" }));

        // Sort descending
        activities.sort((a,b) => b.time - a.time);
        
        if (activities.length === 0) {
            logBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No recent actions.</td></tr>`;
        } else {
            activities.slice(0, 10).forEach(act => {
                const tr = document.createElement("tr");
                const timeStr = act.time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                let statusBadge = `<span class="card-status status-pending">${act.status}</span>`;
                if (act.status === "approved" || act.status === "verified" || act.status === "completed" || act.status === "resolved") {
                    statusBadge = `<span class="card-status status-approved">${act.status}</span>`;
                }

                tr.innerHTML = `
                    <td>${timeStr}</td>
                    <td><strong>${act.type}</strong></td>
                    <td>${act.desc}</td>
                    <td>${act.loc}</td>
                    <td>${statusBadge}</td>
                `;
                logBody.appendChild(tr);
            });
        }

        // 3. Tab: Volunteer Approval Queue
        const volQueueBody = document.getElementById("admin-volunteer-queue-body");
        volQueueBody.innerHTML = "";
        
        const pendingVols = vols.filter(v => v.status === "pending");
        if (pendingVols.length === 0) {
            volQueueBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--color-text-muted);">Queue is empty. No pending volunteer registrations.</td></tr>`;
        } else {
            pendingVols.forEach(vol => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${vol.name}</strong><br><span style="font-size:11px; color:var(--color-text-muted);">${vol.email} | Age: ${vol.age}</span></td>
                    <td>${vol.taluk || ''}, ${vol.district}</td>
                    <td><div style="max-width:180px; font-size:12px; display:flex; flex-wrap:wrap; gap:4px;">${vol.skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}</div></td>
                    <td><p style="font-size:12px; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${vol.intro}">${vol.intro}</p></td>
                    <td>
                        <div class="admin-actions-cell">
                            <button class="btn btn-primary btn-sm btn-approve-vol" data-id="${vol.id}">Approve</button>
                            <button class="btn btn-danger btn-sm btn-reject-vol" data-id="${vol.id}">Delete</button>
                        </div>
                    </td>
                `;
                volQueueBody.appendChild(tr);
            });
        }

        // 4. Tab: Verify Alerts Queue
        const alertQueueBody = document.getElementById("admin-alert-queue-body");
        alertQueueBody.innerHTML = "";
        
        const pendingAlerts = alerts.filter(a => a.verified === false);
        if (pendingAlerts.length === 0) {
            alertQueueBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--color-text-muted);">No pending alerts waiting for verification.</td></tr>`;
        } else {
            pendingAlerts.forEach(alert => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${alert.title}</strong><br><span style="font-size:11px; color:var(--color-text-muted);">${alert.description}</span></td>
                    <td><span class="skill-tag" style="background-color:var(--color-accent-light); color:var(--color-accent);">${alert.category}</span></td>
                    <td>${alert.location}, ${alert.district}</td>
                    <td>${alert.submittedBy}</td>
                    <td>
                        <div class="admin-actions-cell">
                            <button class="btn btn-primary btn-sm btn-verify-alert" data-id="${alert.id}">Verify & Post</button>
                            <button class="btn btn-danger btn-sm btn-reject-alert" data-id="${alert.id}">Delete</button>
                        </div>
                    </td>
                `;
                alertQueueBody.appendChild(tr);
            });
        }

        // 5. Tab: Manage Requests Tickets
        const reqQueueBody = document.getElementById("admin-request-queue-body");
        reqQueueBody.innerHTML = "";

        const activeReqsList = reqs.filter(r => r.status === "active");
        if (activeReqsList.length === 0) {
            reqQueueBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--color-text-muted);">No active support request tickets.</td></tr>`;
        } else {
            activeReqsList.forEach(req => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong style="color:var(--color-accent);">${req.category}</strong><br><span style="font-size:11px; color:var(--color-text-muted);">Addr: ${req.location}</span></td>
                    <td><strong>${req.name}</strong><br><span style="font-size:12px;">Tel: ${req.contact}</span></td>
                    <td><span class="urgency-badge ${req.urgency}" style="padding:2px 8px; font-size:11px;">${req.urgency}</span></td>
                    <td><p style="font-size:12px; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${req.description}">${req.description}</p></td>
                    <td>
                        <div class="admin-actions-cell">
                            <button class="btn btn-primary btn-sm btn-resolve-req" data-id="${req.id}">Complete</button>
                            <button class="btn btn-danger btn-sm btn-delete-req" data-id="${req.id}">Delete</button>
                        </div>
                    </td>
                `;
                reqQueueBody.appendChild(tr);
            });
        }

        // Bind Admin Action Event Listeners
        bindAdminActionListeners();

    } catch (e) {
        showToast("Dashboard Error", "Failed to retrieve logs.", "danger");
        console.error("Dashboard refresh failure", e);
    }
};

const bindAdminActionListeners = () => {
    // Approve Volunteers
    document.querySelectorAll(".btn-approve-vol").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            dbService.volunteers.approve(id).then(() => {
                showToast("Volunteer Approved", "Profile is now visible on directory.");
                loadAdminDashboardData();
                loadVolunteerDirectory();
                refreshGlobalStats();
            }).catch(e => showToast("Error", e.message, "danger"));
        });
    });

    // Delete Volunteers
    document.querySelectorAll(".btn-reject-vol").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!confirm("Are you sure you want to remove this volunteer profile?")) return;
            const id = btn.getAttribute("data-id");
            dbService.volunteers.remove(id).then(() => {
                showToast("Volunteer Removed", "Profile deleted successfully.", "warning");
                loadAdminDashboardData();
                loadVolunteerDirectory();
                refreshGlobalStats();
            }).catch(e => showToast("Error", e.message, "danger"));
        });
    });

    // Verify Alerts
    document.querySelectorAll(".btn-verify-alert").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            dbService.alerts.verify(id).then(() => {
                showToast("Alert Broadcasted", "Verified and published to community boards.");
                loadAdminDashboardData();
                loadAlertsTimeline();
            }).catch(e => showToast("Error", e.message, "danger"));
        });
    });

    // Delete Alerts
    document.querySelectorAll(".btn-reject-alert").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!confirm("Delete this community alert permanently?")) return;
            const id = btn.getAttribute("data-id");
            dbService.alerts.remove(id).then(() => {
                showToast("Alert Dismissed", "Spam report deleted.", "warning");
                loadAdminDashboardData();
                loadAlertsTimeline();
            }).catch(e => showToast("Error", e.message, "danger"));
        });
    });

    // Resolve requests
    document.querySelectorAll(".btn-resolve-req").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            dbService.helpRequests.updateStatus(id, "completed").then(() => {
                showToast("Ticket Resolved", "Help request resolved successfully!");
                loadAdminDashboardData();
                loadHelpRequestsFeed();
                refreshGlobalStats();
            }).catch(e => showToast("Error", e.message, "danger"));
        });
    });

    // Delete requests
    document.querySelectorAll(".btn-delete-req").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!confirm("Remove this ticket from database?")) return;
            const id = btn.getAttribute("data-id");
            dbService.helpRequests.delete(id).then(() => {
                showToast("Ticket Deleted", "Request removed.", "warning");
                loadAdminDashboardData();
                loadHelpRequestsFeed();
                refreshGlobalStats();
            }).catch(e => showToast("Error", e.message, "danger"));
        });
    });
};

// =========================================================================
// TOAST NOTIFICATIONS MAKER
// =========================================================================
const showToast = (title, message, type = "success") => {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-solid fa-circle-check";
    if (type === "warning") iconClass = "fa-solid fa-triangle-exclamation";
    if (type === "danger") iconClass = "fa-solid fa-skull-crossbones";
    if (type === "info") iconClass = "fa-solid fa-circle-info";

    toast.innerHTML = `
        <div class="toast-icon"><i class="${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = "translateX(50px)";
        setTimeout(() => toast.remove(), 300);
    }, 4500);

    // Manual close button
    toast.querySelector(".toast-close").addEventListener("click", () => {
        clearTimeout(dismissTimer);
        toast.remove();
    });
};
export { showToast };
