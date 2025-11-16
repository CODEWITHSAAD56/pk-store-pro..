// Admin Panel Management
class AdminPanel {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkAdminAccess();
        this.loadDashboardStats();
        this.setupEventListeners();
        this.loadRecentOrders();
        this.loadAllProducts();
        this.loadAllCustomers();
    }
    
    checkAdminAccess() {
        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'customer-login.html';
                return;
            }
            
            this.getUserRole(user.uid).then(role => {
                if (role !== 'admin') {
                    window.location.href = 'index.html';
                } else {
                    document.getElementById('adminWelcome').textContent = `Welcome, ${user.email}`;
                }
            });
        });
    }
    
    async getUserRole(uid) {
        try {
            const snapshot = await db.ref('users/' + uid + '/role').once('value');
            return snapshot.val();
        } catch (error) {
            return 'customer';
        }
    }
    
    loadDashboardStats() {
        getDashboardStats().then(stats => {
            document.getElementById('totalProducts').textContent = stats.totalProducts;
            document.getElementById('totalOrders').textContent = stats.totalOrders;
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            document.getElementById('totalRevenue').textContent = stats.totalRevenue.toLocaleString();
        });
    }
    
    loadRecentOrders() {
        db.ref('orders').orderByChild('createdAt').limitToLast(5).once('value')
            .then(snapshot => {
                const orders = [];
                snapshot.forEach(childSnap => {
                    orders.push(childSnap.val());
                });
                this.displayRecentOrders(orders.reverse());
            });
    }
    
    displayRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<p>No recent orders</p>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-item" style="background:white;padding:1rem;margin:0.5rem 0;border-radius:8px;border-left:4px solid #3498db;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong>Order #${order.id.slice(-6)}</strong>
                        <div style="color:#666;font-size:0.9rem;">${new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:bold;color:#e74c3c;">Rs. ${order.total.toLocaleString()}</div>
                        <span class="status ${order.status}" style="padding:0.25rem 0.5rem;border-radius:4px;font-size:0.8rem;background:#f8f9fa;">
                            ${order.status}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    loadAllProducts() {
        db.ref('products').once('value')
            .then(snapshot => {
                const products = [];
                snapshot.forEach(childSnap => {
                    products.push({
                        id: childSnap.key,
                        ...childSnap.val()
                    });
                });
                this.displayAllProducts(products);
            });
    }
    
    displayAllProducts(products) {
        const container = document.getElementById('allProducts');
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = '<p>No products found</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="display:grid;gap:1rem;">
                ${products.map(product => `
                    <div class="product-item" style="background:white;padding:1rem;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:1rem;">
                            <div style="width:60px;height:60px;background:#f8f9fa;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                                ${product.imageUrl ? 
                                    `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">` :
                                    '📦'
                                }
                            </div>
                            <div>
                                <div style="font-weight:bold;">${product.name}</div>
                                <div style="color:#666;">Rs. ${product.price.toLocaleString()}</div>
                            </div>
                        </div>
                        <div>
                            <span style="background:#e9ecef;padding:0.25rem 0.5rem;border-radius:4px;font-size:0.8rem;">
                                Stock: ${product.stock || 0}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    loadAllCustomers() {
        db.ref('users').once('value')
            .then(snapshot => {
                const customers = [];
                snapshot.forEach(childSnap => {
                    const user = childSnap.val();
                    if (user.role === 'customer') {
                        customers.push({
                            id: childSnap.key,
                            ...user
                        });
                    }
                });
                this.displayAllCustomers(customers);
            });
    }
    
    displayAllCustomers(customers) {
        const container = document.getElementById('customersList');
        if (!container) return;
        
        if (customers.length === 0) {
            container.innerHTML = '<p>No customers found</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="display:grid;gap:1rem;">
                ${customers.map(customer => `
                    <div class="customer-item" style="background:white;padding:1rem;border-radius:8px;">
                        <div style="font-weight:bold;">${customer.name || 'No Name'}</div>
                        <div style="color:#666;">${customer.email}</div>
                        <div style="color:#666;font-size:0.9rem;">
                            Joined: ${new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    setupEventListeners() {
        // Product form submission
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', this.handleProductSubmit.bind(this));
        }
    }
    
    async handleProductSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value
        };
        
        const imageFile = document.getElementById('productImage').files[0];
        
        try {
            let imageUrl = null;
            
            if (imageFile) {
                imageUrl = await this.uploadProductImage(imageFile);
                formData.imageUrl = imageUrl;
            }
            
            await this.addProductToDatabase(formData);
            showNotification('Product added successfully!', 'success');
            e.target.reset();
            this.loadDashboardStats();
            this.loadAllProducts();
            
        } catch (error) {
            showNotification('Error adding product: ' + error.message, 'error');
        }
    }
    
    async uploadProductImage(file) {
        const storageRef = storage.ref('products/' + Date.now() + '_' + file.name);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    }
    
    async addProductToDatabase(productData) {
        const productId = db.ref('products').push().key;
        return db.ref('products/' + productId).set({
            ...productData,
            id: productId,
            createdAt: new Date().toISOString()
        });
    }
}

// UI Functions for Admin
function showContent(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

function searchSidebar() {
    const query = document.getElementById('sidebarSearch').value.toLowerCase();
    document.querySelectorAll('.menu-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard')) {
        new AdminPanel();
    }
});