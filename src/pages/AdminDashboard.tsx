"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Lock,
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Users,
  ShoppingCart,
} from "lucide-react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { toast } from "sonner";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = "https://dolly-backend-fjlu.onrender.com";

const formatPrice = (num: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

interface Product {
  _id: string;
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  featured?: boolean;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Order {
  _id: string;
  customerName: string;
  phone: string;
  email: string;
  status: "Pending" | "Paid" | "Delivered" | "Cancelled";
  totalAmount: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  createdAt: string;
  paymentMethod?: string;
  notes?: string;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Change password modal (first login)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  // Existing states
  const [activeTab, setActiveTab] = useState<"products" | "users" | "orders">(
    "products",
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Product modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    stock: 0,
    featured: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    const storedAdmin = localStorage.getItem("adminData");

    if (storedToken && storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setToken(storedToken);
        setCurrentAdmin(parsedAdmin);
        setAuthenticated(true);
      } catch (err) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
      }
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (authenticated && token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      fetchProducts();
      fetchAdmins();
      fetchOrders();

      // Force password change on first login
      if (currentAdmin?.needsPasswordChange) {
        setShowChangePassword(true);
        toast.info("For security reasons, please set a new password now.");
      }
    }
  }, [authenticated, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: loginEmail.trim(),
        password: loginPassword,
      });

      const { token: newToken, admin } = res.data;

      localStorage.setItem("adminToken", newToken);
      localStorage.setItem("adminData", JSON.stringify(admin));

      setToken(newToken);
      setCurrentAdmin(admin);
      setAuthenticated(true);
      toast.success("Login successful");

      if (admin.needsPasswordChange) {
        setShowChangePassword(true);
      }
    } catch (err: any) {
      setLoginError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeLoading(true);

    if (newPassword !== confirmNewPassword) {
      setChangeError("New passwords do not match");
      setChangeLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setChangeError("New password must be at least 6 characters long");
      setChangeLoading(false);
      return;
    }

    try {
      await axios.patch(
        `${API_BASE}/admins/${currentAdmin._id}/password`,
        {
          currentPassword: currentPassword || loginPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Password updated successfully. Please log in again.");
      handleLogout();
    } catch (err: any) {
      setChangeError(
        err.response?.data?.error || "Failed to update password. Try again.",
      );
    } finally {
      setChangeLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    delete axios.defaults.headers.common["Authorization"];
    setAuthenticated(false);
    setToken(null);
    setCurrentAdmin(null);
    setShowChangePassword(false);
    setLoginPassword("");
    toast.info("You have been logged out");
  };

  const fetchProducts = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await axios.get<Product[]>(`${API_BASE}/products`, {
        timeout: 45000,
      });
      setProducts(res.data || []);
    } catch (err: any) {
      setFetchError(
        err.code === "ECONNABORTED"
          ? "Backend is waking up (Render free tier delay). Try again in 20–40 seconds."
          : "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await axios.get<AdminUser[]>(`${API_BASE}/admins`);
      setAdmins(res.data || []);
    } catch (err) {
      console.error("Failed to load admins:", err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/admins`, adminForm);
      setAdminForm({ name: "", email: "", password: "" });
      fetchAdmins();
      toast.success("Admin added");
    } catch (err) {
      toast.error("Failed to add admin");
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get<Order[]>(`${API_BASE}/orders`);
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Could not load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    try {
      await axios.patch(`${API_BASE}/orders/${orderId}`, { status: newStatus });
      toast.success(`Order updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      price: 0,
      image: "",
      category: "",
      stock: 0,
      featured: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id || "",
      name: product.name,
      description: product.description || "",
      price: product.price,
      image: product.image || "",
      category: product.category,
      stock: product.stock,
      featured: !!product.featured,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value) || 0
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingProduct) {
        await axios.put(
          `${API_BASE}/products/${editingProduct._id}`,
          formData,
          {
            timeout: 30000,
          },
        );
      } else {
        await axios.post(`${API_BASE}/products`, formData, { timeout: 30000 });
      }
      setIsModalOpen(false);
      await fetchProducts();
      toast.success(editingProduct ? "Product updated" : "Product created");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    setActionLoading(true);
    try {
      await axios.delete(`${API_BASE}/products/${id}`, { timeout: 20000 });
      await fetchProducts();
      toast.success("Product deleted");
    } catch (err) {
      toast.error("Failed to delete product");
    } finally {
      setActionLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Login Screen
  // ────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md animate-fade-in">
        <div className="bg-card rounded-xl border p-8 shadow-lg">
          <Lock className="h-12 w-12 text-accent mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-center mb-2">Admin Login</h1>
          <p className="text-center text-muted-foreground mb-8">
            Sign in to manage your store
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter your password"
                required
                autoFocus
              />
            </div>

            {loginError && (
              <p className="text-destructive text-sm text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-accent text-accent-foreground py-2.5 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // Change Password Modal (first login only)
  // ────────────────────────────────────────────────
  const ChangePasswordModal = () => (
    <Transition appear show={showChangePassword} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-8 text-left shadow-xl border">
                <Dialog.Title as="h3" className="text-xl font-bold mb-6">
                  Set Your New Admin Password
                </Dialog.Title>

                <p className="text-muted-foreground mb-6">
                  For security, please create a new strong password. You will
                  need to log in again after this step.
                </p>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                      placeholder="The password you just used to log in"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                      placeholder="Re-enter new password"
                    />
                  </div>

                  {changeError && (
                    <p className="text-destructive text-sm">{changeError}</p>
                  )}

                  <div className="mt-8 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-5 py-2.5 border rounded-md hover:bg-muted transition"
                    >
                      Logout instead
                    </button>
                    <button
                      type="submit"
                      disabled={changeLoading}
                      className="px-6 py-2.5 bg-accent text-accent-foreground rounded-md hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {changeLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Update Password
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // ────────────────────────────────────────────────
  // Main Dashboard
  // ────────────────────────────────────────────────
  const totalProducts = products.length;
  const inStock = products.filter((p) => p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => 0 < p.stock && p.stock <= 5).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const pieData = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [inStock - lowStock, lowStock, outOfStock],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {currentAdmin?.email || "Admin"}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex space-x-8">
          {["products", "users", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 font-medium capitalize ${
                activeTab === tab
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <>
          {fetchError && (
            <div className="bg-destructive/20 text-destructive p-4 rounded-md mb-6">
              {fetchError}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <span className="ml-3">Loading products...</span>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                  {
                    icon: Package,
                    label: "Total Products",
                    value: totalProducts,
                    color: "text-accent",
                  },
                  {
                    icon: ShoppingBag,
                    label: "In Stock",
                    value: inStock,
                    color: "text-emerald-500",
                  },
                  {
                    icon: Package,
                    label: "Low Stock",
                    value: lowStock,
                    color: "text-yellow-500",
                  },
                  {
                    icon: Package,
                    label: "Out of Stock",
                    value: outOfStock,
                    color: "text-destructive",
                  },
                  {
                    icon: DollarSign,
                    label: "Inventory Value",
                    value: formatPrice(totalValue),
                    color: "text-accent",
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div
                    key={label}
                    className="bg-card rounded-lg border p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-8 w-8 ${color}`} />
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-xl font-bold text-card-foreground">
                          {value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pie Chart */}
              {totalProducts > 0 && (
                <div className="bg-card rounded-lg border p-6 mb-8 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">
                    Stock Distribution
                  </h2>
                  <div className="max-w-xs mx-auto">
                    <Pie
                      data={pieData}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: "bottom" } },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Products Table */}
              <div className="bg-card rounded-lg border overflow-hidden shadow-sm">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Products</h2>
                  <button
                    onClick={openAddModal}
                    disabled={actionLoading}
                    className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus size={18} /> Add Product
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-6 py-3 font-semibold">
                          ID
                        </th>
                        <th className="text-left px-6 py-3 font-semibold">
                          Product
                        </th>
                        <th className="text-left px-6 py-3 font-semibold">
                          Category
                        </th>
                        <th className="text-right px-6 py-3 font-semibold">
                          Price
                        </th>
                        <th className="text-right px-6 py-3 font-semibold">
                          Stock
                        </th>
                        <th className="text-center px-6 py-3 font-semibold">
                          Featured
                        </th>
                        <th className="text-center px-6 py-3 font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-12 text-muted-foreground"
                          >
                            No products yet. Add one to get started.
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr
                            key={p._id}
                            className="border-b last:border-0 hover:bg-muted/30"
                          >
                            <td className="px-6 py-4 font-mono text-muted-foreground">
                              {p.id || "—"}
                            </td>
                            <td className="px-6 py-4 font-medium">{p.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {p.category}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {formatPrice(p.price)}
                            </td>
                            <td className="px-6 py-4 text-right">{p.stock}</td>
                            <td className="px-6 py-4 text-center">
                              {p.featured ? (
                                <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-green-500/20 text-green-700">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-gray-500/20 text-gray-700">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center flex justify-center gap-4">
                              <button
                                onClick={() => openEditModal(p)}
                                disabled={actionLoading}
                                className="text-accent hover:text-accent/80 disabled:opacity-50"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(p._id)}
                                disabled={actionLoading}
                                className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* USERS / ADMINS TAB */}
      {activeTab === "users" && (
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={20} /> Manage Admins
          </h2>

          {loadingAdmins ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <form
                onSubmit={handleAddAdmin}
                className="mb-8 bg-muted/30 p-5 rounded-lg border"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input
                      value={adminForm.name}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Password</label>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded bg-background"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="bg-accent text-white px-6 py-2 rounded hover:opacity-90"
                    >
                      Add Admin
                    </button>
                  </div>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-6 py-3">Name</th>
                      <th className="text-left px-6 py-3">Email</th>
                      <th className="text-center px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No admins added yet.
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr
                          key={admin._id}
                          className="border-b hover:bg-muted/30"
                        >
                          <td className="px-6 py-4">{admin.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {admin.email}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${admin.name}?`)) {
                                  axios
                                    .delete(`${API_BASE}/admins/${admin._id}`)
                                    .then(() => {
                                      fetchAdmins();
                                      toast.success("Admin removed");
                                    })
                                    .catch(() => toast.error("Delete failed"));
                                }
                              }}
                              className="text-destructive hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart size={20} /> Orders
          </h2>

          {loadingOrders ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders received yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-6 py-3">Customer</th>
                    <th className="text-left px-6 py-3">Phone</th>
                    <th className="text-left px-6 py-3">Items</th>
                    <th className="text-right px-6 py-3">Total</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-center px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4">{order.phone}</td>
                      <td className="px-6 py-4">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("en-KE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order._id, e.target.value)
                          }
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border appearance-none cursor-pointer ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : order.status === "Paid"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : order.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  : "bg-red-100 text-red-800 border-red-300"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-card p-6 text-left shadow-xl border">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6"
                  >
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Unique Product ID (e.g. P-001)
                      </label>
                      <input
                        name="id"
                        value={formData.id}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                        placeholder="P-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Product Name
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                        placeholder="e.g. Cordless Drill"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                        placeholder="Product details..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Price (KSh)
                        </label>
                        <input
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Stock Quantity
                        </label>
                        <input
                          name="stock"
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Category
                        </label>
                        <input
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          required
                          placeholder="e.g. Power Tools"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Image URL
                        </label>
                        <input
                          name="image"
                          value={formData.image}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleFormChange}
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <label htmlFor="featured" className="text-sm font-medium">
                        Featured product (show on homepage)
                      </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        disabled={actionLoading}
                        className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {editingProduct ? "Update" : "Create"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Change Password Modal */}
      <ChangePasswordModal />
    </div>
  );
}
