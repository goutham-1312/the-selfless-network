/**
 * Selfless Network - Firebase and Database Service Layer
 * Supports Firebase Web SDK v10 (Auth & Firestore) with an automatic Mock Database fallback
 * using localStorage when Firebase is not configured.
 */

// Firebase SDK imports from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    setDoc,
    getDocs, 
    getDoc,
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
// Replace these with your actual Firebase project settings.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Check if Firebase config is configured with real values
const isFirebaseConfigured = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app = null;
let firestore = null;
let firebaseAuth = null;
let isMockMode = true;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        firebaseAuth = getAuth(app);
        isMockMode = false;
        console.log("Selfless Network: Connected to Firebase successfully!");
    } catch (error) {
        console.warn("Selfless Network: Failed to initialize Firebase. Falling back to Mock Database.", error);
        isMockMode = true;
    }
} else {
    console.log("Selfless Network: Firebase is not configured. Running in Mock Database mode (LocalStorage).");
    isMockMode = true;
}

// =========================================================================
// MOCK DATABASE & AUTH IMPLEMENTATION (LocalStorage Fallback)
// =========================================================================

// Seed default data if localStorage is empty
const seedMockData = () => {
    if (!localStorage.getItem("sn_seeded")) {
        // Default admin and users
        const users = [
            { id: "admin_uid", email: "goutham@selfless.org", password: "Goutham1312", role: "admin", name: "Goutham M" },
            { id: "user_uid_1", email: "goutham@learner.com", password: "password123", role: "volunteer", name: "Goutham" },
            { id: "user_uid_2", email: "priya@gmail.com", password: "password123", role: "volunteer", name: "Priya R" }
        ];

        // Default volunteers (some pending, some approved)
        const volunteers = [
            { 
                id: "vol_1", 
                userId: "user_uid_1",
                name: "Goutham M", 
                age: 21, 
                gender: "Male",
                phone: "9876543210", 
                email: "goutham@learner.com", 
                district: "Chennai", 
                taluk: "Adyar", 
                village: "Besant Nagar", 
                skills: ["Medical Assistance", "Rescue Operations", "Environmental Cleanup"], 
                languages: ["Tamil", "English"], 
                availability: ["Saturday", "Sunday"], 
                emergencyContact: "Anitha M - 9876543211", 
                intro: "Computer Science student eager to participate in rescue operations and green cleanups.", 
                status: "approved",
                sharePublicly: true,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() 
            },
            { 
                id: "vol_2", 
                userId: "user_uid_2",
                name: "Priya R", 
                age: 24, 
                gender: "Female",
                phone: "9444123456", 
                email: "priya@gmail.com", 
                district: "Coimbatore", 
                taluk: "Coimbatore North", 
                village: "Ganapathy", 
                skills: ["Blood Donation", "Teaching & Guiding", "First Aid"], 
                languages: ["Tamil", "English", "Malayalam"], 
                availability: ["Monday", "Wednesday", "Friday"], 
                emergencyContact: "Ramesh K - 9444123457", 
                intro: "Active volunteer with blood donor registry network.", 
                status: "approved",
                sharePublicly: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            { 
                id: "vol_3", 
                userId: null,
                name: "Karthik Raja", 
                age: 28, 
                gender: "Male",
                phone: "9123456789", 
                email: "karthik@gmail.com", 
                district: "Madurai", 
                taluk: "Madurai South", 
                village: "Avaniyapuram", 
                skills: ["Food Distribution", "Logistics & Transport"], 
                languages: ["Tamil"], 
                availability: ["Saturday"], 
                emergencyContact: "Raja S - 9123456780", 
                intro: "I own a small transport vehicle and can help deliver food and relief items during emergencies.", 
                status: "pending",
                sharePublicly: true,
                createdAt: new Date().toISOString()
            }
        ];

        // Default help requests
        const helpRequests = [
            {
                id: "req_1",
                name: "Sundaram Subbiah",
                contact: "9003012345",
                district: "Chennai",
                taluk: "Mylapore",
                location: "Near Kapaleeshwarar Temple",
                category: "Medical Assistance Needed",
                description: "An elderly neighbor needs a wheelchair and immediate delivery of medicine for heart condition. Roads are slightly waterlogged.",
                urgency: "High",
                status: "active",
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            },
            {
                id: "req_2",
                name: "Arun Kumar",
                contact: "9789012345",
                district: "Coimbatore",
                taluk: "Pollachi",
                location: "Government High School, Pollachi",
                category: "Community Service Activity",
                description: "Organizing a tree plantation campaign and plastics cleanup around the school lake this Saturday. Need 10-15 volunteers.",
                urgency: "Medium",
                status: "active",
                createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
            },
            {
                id: "req_3",
                name: "Revathi S",
                contact: "9845012345",
                district: "Trichy",
                taluk: "Srirangam",
                location: "Kaveri River Bank Road",
                category: "Flood Relief",
                description: "Assisting local shelter with food packet packaging for 50 displaced families due to high river overflow warnings.",
                urgency: "Critical",
                status: "completed",
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Default community alerts
        const alerts = [
            {
                id: "alert_1",
                title: "O-Negative Blood Urgently Needed",
                category: "Blood Donation Needed",
                district: "Chennai",
                taluk: "Adyar",
                location: "Fortis Malar Hospital, Adyar",
                description: "Urgent requirements of 3 units of O-ve blood for emergency bypass surgery.",
                date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                verified: true,
                submittedBy: "Dr. Vinodh",
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            },
            {
                id: "alert_2",
                title: "Road Blocked due to Tree Fall",
                category: "Road Block",
                district: "Coimbatore",
                taluk: "Mettupalayam",
                location: "Ooty Main Road, Near Kallar",
                description: "Heavy rain has caused a massive banyan tree fall blocking traffic towards Ooty. Forest department working, expect 3-hour delay.",
                date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                verified: true,
                submittedBy: "Traffic Police Dept",
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            },
            {
                id: "alert_3",
                title: "Water Logging in Madurai Lower Areas",
                category: "Flood",
                district: "Madurai",
                taluk: "Madurai North",
                location: "Sellur and Sellur Underpass",
                description: "Heavy rain has caused water logging up to 2 feet in low-lying residential layouts. Residents requested to stay safe.",
                date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                verified: false,
                submittedBy: "Public Report",
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Notifications
        const notifications = [
            {
                id: "notif_1",
                district: "Chennai",
                title: "New Help Request: Medical Assistance",
                message: "A new High urgency request was posted in Mylapore, Chennai.",
                type: "request",
                targetId: "req_1",
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: "notif_2",
                district: "Chennai",
                title: "New Community Alert: O-Negative Blood",
                message: "Verified Alert: O-Negative blood needed in Adyar, Chennai.",
                type: "alert",
                targetId: "alert_1",
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                read: false
            }
        ];

        localStorage.setItem("sn_users", JSON.stringify(users));
        localStorage.setItem("sn_volunteers", JSON.stringify(volunteers));
        localStorage.setItem("sn_requests", JSON.stringify(helpRequests));
        localStorage.setItem("sn_alerts", JSON.stringify(alerts));
        localStorage.setItem("sn_notifications", JSON.stringify(notifications));
        localStorage.setItem("sn_seeded", "true");
    }
};

seedMockData();

// Helper to write to local storage
const setLocalData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
// Helper to read from local storage
const getLocalData = (key) => JSON.parse(localStorage.getItem(key)) || [];

// Listeners collection for Auth in Mock Mode
const mockAuthListeners = [];

const notifyMockAuthChange = (user) => {
    mockAuthListeners.forEach(cb => {
        try {
            cb(user);
        } catch (e) {
            console.error("Error in mock auth listener", e);
        }
    });
};

const mockAuthService = {
    signUp: async (email, password, name, role = "volunteer") => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = getLocalData("sn_users");
                if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                    reject(new Error("Email already registered."));
                    return;
                }
                const newUserId = "user_" + Date.now();
                const newUser = { id: newUserId, email, password, name, role };
                users.push(newUser);
                setLocalData("sn_users", users);
                
                // Set current session
                localStorage.setItem("sn_current_user", JSON.stringify(newUser));
                notifyMockAuthChange(newUser);
                resolve(newUser);
            }, 500);
        });
    },

    logIn: async (email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = getLocalData("sn_users");
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
                if (!user) {
                    reject(new Error("Invalid email or password."));
                    return;
                }
                localStorage.setItem("sn_current_user", JSON.stringify(user));
                notifyMockAuthChange(user);
                resolve(user);
            }, 500);
        });
    },

    logOut: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.removeItem("sn_current_user");
                notifyMockAuthChange(null);
                resolve();
            }, 300);
        });
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem("sn_current_user");
        return userStr ? JSON.parse(userStr) : null;
    },

    onAuthStateChanged: (callback) => {
        mockAuthListeners.push(callback);
        // Emulate listener by executing once immediately
        callback(mockAuthService.getCurrentUser());
        
        // Listen to storage changes for multi-tab auth sync
        const storageHandler = (e) => {
            if (e.key === "sn_current_user") {
                callback(mockAuthService.getCurrentUser());
            }
        };
        window.addEventListener("storage", storageHandler);
        
        return () => {
            const idx = mockAuthListeners.indexOf(callback);
            if (idx !== -1) mockAuthListeners.splice(idx, 1);
            window.removeEventListener("storage", storageHandler);
        };
    },

    resetPassword: async (email) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = getLocalData("sn_users");
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (!user) {
                    reject(new Error("No user registered with this email."));
                    return;
                }
                resolve("Password reset instructions sent to " + email);
            }, 500);
        });
    }
};

// Listeners collection for real-time notifications in Mock Mode
const notificationListeners = [];

const mockDbService = {
    volunteers: {
        register: async (volunteerData) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const volunteers = getLocalData("sn_volunteers");
                    const newVol = {
                        id: "vol_" + Date.now(),
                        createdAt: new Date().toISOString(),
                        status: "pending", // Requires admin approval
                        ...volunteerData
                    };
                    volunteers.push(newVol);
                    setLocalData("sn_volunteers", volunteers);
                    resolve(newVol);
                }, 500);
            });
        },
        getAll: async () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(getLocalData("sn_volunteers"));
                }, 300);
            });
        },
        approve: async (id) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const volunteers = getLocalData("sn_volunteers");
                    const volIndex = volunteers.findIndex(v => v.id === id);
                    if (volIndex === -1) {
                        reject(new Error("Volunteer not found."));
                        return;
                    }
                    volunteers[volIndex].status = "approved";
                    setLocalData("sn_volunteers", volunteers);
                    resolve(volunteers[volIndex]);
                }, 300);
            });
        },
        remove: async (id) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const volunteers = getLocalData("sn_volunteers");
                    const filtered = volunteers.filter(v => v.id !== id);
                    if (filtered.length === volunteers.length) {
                        reject(new Error("Volunteer not found."));
                        return;
                    }
                    setLocalData("sn_volunteers", filtered);
                    resolve();
                }, 300);
            });
        }
    },

    helpRequests: {
        create: async (requestData) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const requests = getLocalData("sn_requests");
                    const newReq = {
                        id: "req_" + Date.now(),
                        status: "active",
                        createdAt: new Date().toISOString(),
                        ...requestData
                    };
                    requests.push(newReq);
                    setLocalData("sn_requests", requests);

                    // Add Notification for the request's district
                    mockDbService.notifications.create({
                        district: requestData.district,
                        title: "New Help Request: " + requestData.category,
                        message: `A request was submitted in ${requestData.taluk || ''}, ${requestData.district}. Urgency: ${requestData.urgency}`,
                        type: "request",
                        targetId: newReq.id
                    });

                    resolve(newReq);
                }, 500);
            });
        },
        getAll: async () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(getLocalData("sn_requests"));
                }, 300);
            });
        },
        updateStatus: async (id, status) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const requests = getLocalData("sn_requests");
                    const reqIdx = requests.findIndex(r => r.id === id);
                    if (reqIdx === -1) {
                        reject(new Error("Request not found."));
                        return;
                    }
                    requests[reqIdx].status = status;
                    setLocalData("sn_requests", requests);
                    resolve(requests[reqIdx]);
                }, 300);
            });
        },
        delete: async (id) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const requests = getLocalData("sn_requests");
                    const filtered = requests.filter(r => r.id !== id);
                    if (filtered.length === requests.length) {
                        reject(new Error("Request not found."));
                        return;
                    }
                    setLocalData("sn_requests", filtered);
                    resolve();
                }, 300);
            });
        }
    },

    alerts: {
        create: async (alertData) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const alerts = getLocalData("sn_alerts");
                    const newAlert = {
                        id: "alert_" + Date.now(),
                        verified: false, // Requires admin verification
                        createdAt: new Date().toISOString(),
                        ...alertData
                    };
                    alerts.push(newAlert);
                    setLocalData("sn_alerts", alerts);
                    resolve(newAlert);
                }, 500);
            });
        },
        getAll: async () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Sort descending chronologically
                    const sorted = getLocalData("sn_alerts").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    resolve(sorted);
                }, 300);
            });
        },
        verify: async (id) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const alerts = getLocalData("sn_alerts");
                    const alertIdx = alerts.findIndex(a => a.id === id);
                    if (alertIdx === -1) {
                        reject(new Error("Alert not found."));
                        return;
                    }
                    alerts[alertIdx].verified = true;
                    setLocalData("sn_alerts", alerts);

                    // Add Notification for the alert's district once verified
                    const alertItem = alerts[alertIdx];
                    mockDbService.notifications.create({
                        district: alertItem.district,
                        title: "Community Alert: " + alertItem.title,
                        message: `Verified Alert in ${alertItem.location}, ${alertItem.district}. Category: ${alertItem.category}`,
                        type: "alert",
                        targetId: alertItem.id
                    });

                    resolve(alerts[alertIdx]);
                }, 300);
            });
        },
        remove: async (id) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const alerts = getLocalData("sn_alerts");
                    const filtered = alerts.filter(a => a.id !== id);
                    if (filtered.length === alerts.length) {
                        reject(new Error("Alert not found."));
                        return;
                    }
                    setLocalData("sn_alerts", filtered);
                    resolve();
                }, 300);
            });
        }
    },

    notifications: {
        create: async (notifData) => {
            const notifications = getLocalData("sn_notifications");
            const newNotif = {
                id: "notif_" + Date.now(),
                createdAt: new Date().toISOString(),
                read: false,
                ...notifData
            };
            notifications.push(newNotif);
            setLocalData("sn_notifications", notifications);
            
            // Trigger listeners
            notificationListeners.forEach(listener => {
                if (listener.district === notifData.district || listener.district === "all") {
                    listener.callback(newNotif);
                }
            });
            return newNotif;
        },
        getForUser: async (district) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const allNotifs = getLocalData("sn_notifications");
                    const filtered = allNotifs.filter(n => n.district === district).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                    resolve(filtered);
                }, 200);
            });
        },
        onNewNotification: (district, callback) => {
            notificationListeners.push({ district, callback });
            // Return unsubscribe function
            return () => {
                const idx = notificationListeners.findIndex(l => l.callback === callback);
                if (idx !== -1) notificationListeners.splice(idx, 1);
            };
        }
    },

    stats: {
        getCounts: async () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const vols = getLocalData("sn_volunteers");
                    const reqs = getLocalData("sn_requests");
                    
                    const approvedVols = vols.filter(v => v.status === "approved");
                    const activeReqs = reqs.filter(r => r.status === "active");
                    const completedReqs = reqs.filter(r => r.status === "completed" || r.status === "resolved");

                    // Districts covered is the count of unique districts with approved volunteers
                    const uniqueDistricts = new Set(approvedVols.map(v => v.district));
                    
                    resolve({
                        volunteers: approvedVols.length,
                        districts: Math.max(uniqueDistricts.size, 4), // Seeded districts + any new ones
                        activeRequests: activeReqs.length,
                        successfulSupports: completedReqs.length + 8 // Added baseline offset for seeded success stories
                    });
                }, 300);
            });
        }
    }
};

// =========================================================================
// FIREBASE LIVE DATABASE & AUTH IMPLEMENTATION
// =========================================================================

const firebaseAuthService = {
    signUp: async (email, password, name, role = "volunteer") => {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;

        try {
            await setDoc(doc(firestore, "users", user.uid), {
                uid: user.uid,
                email,
                name,
                role,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            // If Firestore write fails, propagate the error so UI can show it.
            throw new Error(`Firebase signup failed: ${error.message}`);
        }

        const userData = { id: user.uid, email, name, role };
        return userData;
    },

    logIn: async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        
        // Fetch custom role from Firestore
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
            return { id: user.uid, ...userDoc.data() };
        }
        return { id: user.uid, email: user.email, role: "volunteer", name: user.displayName || "Volunteer" };
    },

    logOut: async () => {
        await signOut(firebaseAuth);
    },

    getCurrentUser: () => {
        const user = firebaseAuth.currentUser;
        if (!user) return null;
        // In firebase case, we'd look up session or check local storage Cache
        const userStr = localStorage.getItem("sn_current_user");
        return userStr ? JSON.parse(userStr) : { id: user.uid, email: user.email };
    },

    onAuthStateChanged: (callback) => {
        onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                // Fetch details
                try {
                    const userDoc = await getDoc(doc(firestore, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = { id: user.uid, ...userDoc.data() };
                        localStorage.setItem("sn_current_user", JSON.stringify(userData));
                        callback(userData);
                        return;
                    }
                } catch (e) {
                    console.error("Error reading profile", e);
                }
                const fallbackUser = { id: user.uid, email: user.email, role: "volunteer" };
                localStorage.setItem("sn_current_user", JSON.stringify(fallbackUser));
                callback(fallbackUser);
            } else {
                localStorage.removeItem("sn_current_user");
                callback(null);
            }
        });
    },

    resetPassword: async (email) => {
        await sendPasswordResetEmail(firebaseAuth, email);
        return "Password reset email sent!";
    }
};

const firebaseDbService = {
    volunteers: {
        register: async (volunteerData) => {
            const colRef = collection(firestore, "volunteers");
            const docRef = await addDoc(colRef, {
                status: "pending",
                createdAt: new Date().toISOString(),
                ...volunteerData
            });
            return { id: docRef.id, ...volunteerData };
        },
        getAll: async () => {
            const querySnapshot = await getDocs(collection(firestore, "volunteers"));
            const vols = [];
            querySnapshot.forEach((doc) => {
                vols.push({ id: doc.id, ...doc.data() });
            });
            return vols;
        },
        approve: async (id) => {
            const docRef = doc(firestore, "volunteers", id);
            await updateDoc(docRef, { status: "approved" });
            const snapshot = await getDoc(docRef);
            return { id: snapshot.id, ...snapshot.data() };
        },
        remove: async (id) => {
            await deleteDoc(doc(firestore, "volunteers", id));
        }
    },

    helpRequests: {
        create: async (requestData) => {
            const docRef = await addDoc(collection(firestore, "requests"), {
                status: "active",
                createdAt: new Date().toISOString(),
                ...requestData
            });
            
            // Create Firebase-side notification
            await addDoc(collection(firestore, "notifications"), {
                district: requestData.district,
                title: "New Help Request: " + requestData.category,
                message: `A request was submitted in ${requestData.taluk || ''}, ${requestData.district}. Urgency: ${requestData.urgency}`,
                type: "request",
                targetId: docRef.id,
                read: false,
                createdAt: new Date().toISOString()
            });

            return { id: docRef.id, ...requestData };
        },
        getAll: async () => {
            const querySnapshot = await getDocs(collection(firestore, "requests"));
            const reqs = [];
            querySnapshot.forEach((doc) => {
                reqs.push({ id: doc.id, ...doc.data() });
            });
            return reqs;
        },
        updateStatus: async (id, status) => {
            const docRef = doc(firestore, "requests", id);
            await updateDoc(docRef, { status });
            const snapshot = await getDoc(docRef);
            return { id: snapshot.id, ...snapshot.data() };
        },
        delete: async (id) => {
            await deleteDoc(doc(firestore, "requests", id));
        }
    },

    alerts: {
        create: async (alertData) => {
            const docRef = await addDoc(collection(firestore, "alerts"), {
                verified: false,
                createdAt: new Date().toISOString(),
                ...alertData
            });
            return { id: docRef.id, ...alertData };
        },
        getAll: async () => {
            // Firebase limits sorting without index configuration, so query all and sort in JavaScript
            const querySnapshot = await getDocs(collection(firestore, "alerts"));
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },
        verify: async (id) => {
            const docRef = doc(firestore, "alerts", id);
            await updateDoc(docRef, { verified: true });
            const snapshot = await getDoc(docRef);
            const alertItem = snapshot.data();

            // Create Firebase-side notification
            await addDoc(collection(firestore, "notifications"), {
                district: alertItem.district,
                title: "Community Alert: " + alertItem.title,
                message: `Verified Alert in ${alertItem.location}, ${alertItem.district}. Category: ${alertItem.category}`,
                type: "alert",
                targetId: id,
                read: false,
                createdAt: new Date().toISOString()
            });

            return { id: snapshot.id, ...alertItem };
        },
        remove: async (id) => {
            await deleteDoc(doc(firestore, "alerts", id));
        }
    },

    notifications: {
        create: async (notifData) => {
            const docRef = await addDoc(collection(firestore, "notifications"), {
                createdAt: new Date().toISOString(),
                read: false,
                ...notifData
            });
            return { id: docRef.id, ...notifData };
        },
        getForUser: async (district) => {
            const colRef = collection(firestore, "notifications");
            const q = query(
                colRef, 
                where("district", "==", district), 
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const notifs = [];
            querySnapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() });
            });
            return notifs;
        },
        onNewNotification: (district, callback) => {
            const colRef = collection(firestore, "notifications");
            const q = query(
                colRef, 
                where("district", "==", district),
                where("read", "==", false)
            );
            // Real-time listener
            return onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        callback({ id: change.doc.id, ...change.doc.data() });
                    }
                });
            });
        }
    },

    stats: {
        getCounts: async () => {
            // Perform basic count query aggregations
            const volsSnapshot = await getDocs(collection(firestore, "volunteers"));
            const reqsSnapshot = await getDocs(collection(firestore, "requests"));
            
            let approvedVolsCount = 0;
            let activeReqsCount = 0;
            let completedReqsCount = 0;
            const uniqueDistricts = new Set();

            volsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === "approved") {
                    approvedVolsCount++;
                    uniqueDistricts.add(data.district);
                }
            });

            reqsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === "active") {
                    activeReqsCount++;
                } else if (data.status === "completed" || data.status === "resolved") {
                    completedReqsCount++;
                }
            });

            return {
                volunteers: approvedVolsCount,
                districts: Math.max(uniqueDistricts.size, 1),
                activeRequests: activeReqsCount,
                successfulSupports: completedReqsCount
            };
        }
    }
};

// Export services depending on configuration
export const dbService = isMockMode ? mockDbService : firebaseDbService;
export const authService = isMockMode ? mockAuthService : firebaseAuthService;
export const currentDbMode = () => isMockMode ? "Mock Mode (LocalStorage)" : "Firebase Server Mode";
export const isUsingMock = () => isMockMode;
