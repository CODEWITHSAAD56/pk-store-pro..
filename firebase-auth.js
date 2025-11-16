// Enhanced Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // Check existing login
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }
    
    async signUp(email, password, userData) {
        try {
            // Check if email already exists
            const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
            if (snapshot.exists()) {
                throw new Error('This email is already registered');
            }
            
            // Create user in database
            const userId = 'user_' + Date.now();
            await db.ref('users/' + userId).set({
                ...userData,
                email: email,
                password: password,
                id: userId,
                createdAt: new Date().toISOString(),
                role: 'customer'
            });
            
            this.currentUser = { 
                uid: userId, 
                email: email, 
                name: userData.name 
            };
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return this.currentUser;
            
        } catch (error) {
            throw error;
        }
    }
    
    async signIn(email, password) {
        try {
            const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
            if (!snapshot.exists()) {
                throw new Error('Email not found');
            }
            
            let user = null;
            snapshot.forEach(child => {
                const userData = child.val();
                if (userData.password === password) {
                    user = { 
                        uid: child.key, 
                        email: userData.email, 
                        name: userData.name 
                    };
                }
            });
            
            if (!user) {
                throw new Error('Invalid password');
            }
            
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
            
        } catch (error) {
            throw error;
        }
    }
    
    signOut() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Initialize auth
const authManager = new AuthManager();
window.signUp = authManager.signUp.bind(authManager);
window.signIn = authManager.signIn.bind(authManager);
window.signOut = authManager.signOut.bind(authManager);