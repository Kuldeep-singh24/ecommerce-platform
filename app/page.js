"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Store,
  ShieldCheck,
  Search,
  Package,
  FileText,
  Plus,
  LogOut,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function MarketplaceApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("store"); // store | cart | orders | vendor | admin | auth

  // Auth form
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    storeName: "",
  });

  // Products & filters
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");

  // Cart & Checkout
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [lastSplit, setLastSplit] = useState(null);

  // Orders & Analytics
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Vendor Add Product Form
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: "Electronics",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("fs01_token");
    const savedUser = localStorage.getItem("fs01_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, category, sort]);

  useEffect(() => {
    if (token) {
      fetchCart();
      fetchOrders();
    }
  }, [token]);

  async function fetchProducts() {
    const params = new URLSearchParams({ search, category, sort });
    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    if (data.products) setProducts(data.products);
  }

  async function fetchCart() {
    const res = await fetch("/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.items) setCart(data.items);
  }

  async function syncCart(updatedCart) {
    setCart(updatedCart);
    if (token) {
      await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: updatedCart }),
      });
    }
  }

  async function fetchOrders() {
    const res = await fetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.orders) setOrders(data.orders);
    if (data.analytics) setAnalytics(data.analytics);
  }

  async function handleSeed() {
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    alert(data.message || "Demo data seeded!");
    fetchProducts();
  }

  async function handleAuth(e) {
    e.preventDefault();
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authForm),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Authentication failed");

    if (isRegister) {
      alert("Account created! Please log in.");
      setIsRegister(false);
    } else {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("fs01_token", data.token);
      localStorage.setItem("fs01_user", JSON.stringify(data.user));
      setActiveTab("store");
    }
  }

  function handleLogout() {
    setToken("");
    setUser(null);
    setCart([]);
    localStorage.removeItem("fs01_token");
    localStorage.removeItem("fs01_user");
    setActiveTab("store");
  }

  function addToCart(product) {
    if (!token) {
      alert("Please login as a Customer first to use Redis cart caching.");
      setActiveTab("auth");
      return;
    }
    const existing = cart.find((item) => item._id === product._id);
    const updated = existing
      ? cart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      : [...cart, { ...product, quantity: 1 }];
    syncCart(updated);
  }

  async function handleCheckout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: cart, couponCode: coupon }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);

    setLastSplit(data.splitBreakdown);
    setCart([]);
    fetchOrders();
    fetchProducts();
    alert("Checkout complete! Payment split between vendors & platform.");
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newProduct),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);

    alert("Product added to marketplace!");
    setNewProduct({
      title: "",
      description: "",
      price: "",
      category: "Electronics",
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    });
    fetchProducts();
    setActiveTab("store");
  }

  async function updateOrderStatus(orderId, status) {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    fetchOrders();
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow">
        <div className="flex items-center gap-3">
          <Store className="w-7 h-7 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Nexvia Multi-Vendor Marketplace</h1>
            <p className="text-xs text-slate-400">FS-01 Capstone • Redis Cart • Split Payments</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setActiveTab("store")}
            className={`px-3 py-1.5 rounded-lg font-medium ${
              activeTab === "store" ? "bg-amber-500 text-slate-950" : "hover:bg-slate-800"
            }`}
          >
            Storefront
          </button>

          <button
            onClick={() => setActiveTab("cart")}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
              activeTab === "cart" ? "bg-amber-500 text-slate-950" : "hover:bg-slate-800"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
          </button>

          {user && (
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                activeTab === "orders" ? "bg-amber-500 text-slate-950" : "hover:bg-slate-800"
              }`}
            >
              <Package className="w-4 h-4" />
              Orders
            </button>
          )}

          {(user?.role === "vendor" || user?.role === "admin") && (
            <button
              onClick={() => setActiveTab("vendor")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                activeTab === "vendor" ? "bg-amber-500 text-slate-950" : "hover:bg-slate-800"
              }`}
            >
              <Plus className="w-4 h-4" />
              Vendor Studio
            </button>
          )}

          {user?.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                activeTab === "admin" ? "bg-amber-500 text-slate-950" : "hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Analytics
            </button>
          )}

          <button
            onClick={handleSeed}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            Seed Demo Data
          </button>

          {user ? (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-700">
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full">
                {user.name} ({user.role.toUpperCase()})
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab("auth")}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
            >
              Login / Register
            </button>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* STOREFRONT TAB */}
        {activeTab === "store" && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex-1 min-w-[220px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search products across vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="All">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home">Home</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <p className="text-slate-500 mb-3">No products found in the database yet.</p>
                <button
                  onClick={handleSeed}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                >
                  Click to Seed Demo Vendors & Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-44 w-full object-cover bg-slate-100"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {p.vendorId?.storeName || p.vendorId?.name || "Verified Vendor"}
                        </span>
                        <h3 className="font-bold text-base mt-2 line-clamp-1">{p.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t flex items-center justify-between">
                        <div>
                          <p className="text-lg font-extrabold">${p.price.toFixed(2)}</p>
                          <p className="text-[11px] text-slate-400">{p.stock} in stock</p>
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-amber-500 hover:text-slate-950 transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CART & SPLIT CHECKOUT TAB */}
        {activeTab === "cart" && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Redis-Cached Shopping Cart</h2>
            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm">Your cart is empty.</p>
            ) : (
              <>
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item._id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            syncCart(cart.filter((c) => c._id !== item._id))
                          }
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code (try NEXVIA10)"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="border rounded-lg px-3 py-2 text-sm flex-1"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Subtotal:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    * Split Payment Engine automatically routes 90% to each vendor and 10% platform commission.
                  </p>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500"
                  >
                    Checkout & Process Split Payment
                  </button>
                </div>
              </>
            )}

            {lastSplit && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <p className="font-bold text-emerald-800 flex items-center gap-1 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Last Transaction Split Breakdown:
                </p>
                <pre className="overflow-x-auto">{JSON.stringify(lastSplit, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* ORDERS & PDF INVOICES TAB */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Order Lifecycle & PDF Invoices</h2>
            {orders.length === 0 ? (
              <p className="text-slate-500 text-sm bg-white p-6 rounded-xl border">No orders yet.</p>
            ) : (
              orders.map((o) => (
                <div
                  key={o._id}
                  className="bg-white p-5 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-bold text-sm">Order #{o._id}</p>
                    <p className="text-xs text-slate-500">
                      Total: <span className="font-semibold text-slate-900">${o.totalAmount.toFixed(2)}</span> •{" "}
                      {o.items.length} item(s) • Payment: {o.paymentId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                      className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase"
                    >
                      <option value="placed">Placed</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <a
                      href={`/api/orders/${o._id}/invoice`}
                      target="_blank"
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF Invoice
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VENDOR STUDIO TAB */}
        {activeTab === "vendor" && (
          <div className="max-w-lg mx-auto bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Vendor Product Onboarding</h2>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-sm">
              <input
                type="text"
                placeholder="Product Title"
                required
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Product Description"
                required
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price ($)"
                  required
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  required
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home">Home</option>
              </select>
              <input
                type="text"
                placeholder="S3 / Image URL"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400"
              >
                Publish Product to Marketplace
              </button>
            </form>
          </div>
        )}

        {/* ADMIN ANALYTICS TAB */}
        {activeTab === "admin" && analytics && (
          <div>
            <h2 className="text-xl font-bold mb-4">Platform Admin Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-xs text-slate-500">Gross Merchandise Value</p>
                <p className="text-2xl font-extrabold mt-1">${analytics.totalRevenue}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-xs text-slate-500">Platform Commission (10%)</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                  ${analytics.platformCommission}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-xs text-slate-500">Total Orders</p>
                <p className="text-2xl font-extrabold mt-1">{analytics.totalOrders}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-xs text-slate-500">Active Vendors / Products</p>
                <p className="text-2xl font-extrabold mt-1">
                  {analytics.vendorCount} / {analytics.productCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AUTH TAB */}
        {activeTab === "auth" && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-2">
              {isRegister ? "Create Marketplace Account" : "Sign In"}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Demo Accounts (Password: <code>password123</code>):<br />
              • Vendor: <code>vendor1@nexvia.com</code><br />
              • Admin: <code>admin@nexvia.com</code>
            </p>
            <form onSubmit={handleAuth} className="space-y-3 text-sm">
              {isRegister && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <select
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                  {authForm.role === "vendor" && (
                    <input
                      type="text"
                      placeholder="Vendor Store Name"
                      required
                      value={authForm.storeName}
                      onChange={(e) => setAuthForm({ ...authForm, storeName: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  )}
                </>
              )}
              <input
                type="email"
                placeholder="Email Address"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800"
              >
                {isRegister ? "Register" : "Login"}
              </button>
            </form>
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="mt-4 text-xs text-indigo-600 hover:underline w-full text-center"
            >
              {isRegister ? "Already have an account? Login" : "Need an account? Register"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}