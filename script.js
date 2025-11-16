// Cart Functions
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image,
            quantity: 1
        });
    }
    
    updateCartStorage();
    updateCartUI();
    showNotification('Product added to cart!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartStorage();
    updateCartUI();
    showNotification('Product removed from cart!', 'info');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartStorage();
            updateCartUI();
        }
    }
}

function updateCartStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart page if exists
    updateCartPage();
}

function updateCartPage() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <h3>Your cart is empty</h3>
                    <p>Add some products to your cart</p>
                    <a href="store.html" class="btn-primary" style="display: inline-block; padding: 1rem 2rem; background: #3498db; color: white; text-decoration: none; border-radius: 8px; margin-top: 1rem;">Continue Shopping</a>
                </div>
            `;
            if (cartTotalElement) cartTotalElement.textContent = '0';
            return;
        }
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-image">
                        ${item.image ? 
                            `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` :
                            '<i class="fas fa-box" style="font-size: 2rem;"></i>'
                        }
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <div class="product-price">Rs. ${item.price.toLocaleString()}</div>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    </div>
                    <div class="item-total">
                        Rs. ${(item.price * item.quantity).toLocaleString()}
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    }
    
    if (cartTotalElement) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = total.toLocaleString();
    }
    
    // Update totals
    updateCartTotals();
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Order Processing
function processOrder(orderData) {
    return new Promise(async (resolve, reject) => {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            if (!user) {
                reject(new Error('User not logged in'));
                return;
            }
            
            const orderId = 'order_' + Date.now();
            const order = {
                id: orderId,
                userId: user.uid,
                items: cart,
                subtotal: getCartTotal(),
                shipping: 200,
                tax: getCartTotal() * 0.05,
                total: getCartTotal() + 200 + (getCartTotal() * 0.05),
                status: 'pending',
                shippingAddress: orderData.shippingAddress,
                paymentMethod: orderData.paymentMethod,
                createdAt: new Date().toISOString(),
                estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
            
            await db.ref('orders/' + orderId).set(order);
            
            // Clear cart after successful order
            cart = [];
            updateCartStorage();
            updateCartUI();
            
            resolve(orderId);
        } catch (error) {
            reject(error);
        }
    });
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
});