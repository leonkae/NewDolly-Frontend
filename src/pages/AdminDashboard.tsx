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
} from "lucide-react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Your real deployed backend
const API_BASE = "https://dolly-backend-fjlu.onrender.com";

// formatPrice helper – updated for Kenyan Shillings with 2 decimal places
const formatPrice = (num: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

interface Product {
  _id: string; // MongoDB uses _id
  id: string; // ← the custom unique ID entered by user
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Modal & form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    id: "", // ← added for user-entered unique ID
    name: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    stock: 0,
    featured: false,
  });

  useEffect(() => {
    if (authenticated) {
      fetchProducts();
    }
  }, [authenticated]);

  const fetchProducts = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await axios.get<Product[]>(`${API_BASE}/products`, {
        timeout: 45000,
      });
      setProducts(res.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setFetchError(
        err.code === "ECONNABORTED"
          ? "Backend is waking up (Render free tier delay). Try again in 20–40 seconds."
          : "Failed to load products. Check if backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password. (Hint: admin123 for demo)");
    }
  };

  // Modal open handlers
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      id: "", // ← added
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
      id: product.id || "", // ← added
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
        await axios.post(`${API_BASE}/products`, formData, {
          timeout: 30000,
        });
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      console.error("Save error:", err);
      alert(
        err.response?.data?.error ||
          "Failed to save product. Backend may be slow — try again.",
      );
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
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Failed to delete product.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-sm animate-fade-in">
        <div className="bg-card rounded-lg border p-8 text-center shadow-lg">
          <Lock className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-card-foreground mb-2">
            Admin Access
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter password to continue
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button type="submit" className="btn-accent w-full py-2.5">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Stats
  const totalProducts = products.length;
  const inStock = products.filter((p) => p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => 0 < p.stock && p.stock <= 5).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const avgPrice =
    totalProducts > 0
      ? (products.reduce((sum, p) => sum + p.price, 0) / totalProducts).toFixed(
          2,
        )
      : "0.00";

  const pieData = {
    labels: ["In Stock (good)", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [inStock - lowStock, lowStock, outOfStock],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-heading text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => setAuthenticated(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Logout
        </button>
      </div>

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

          {/* Stock Pie Chart */}
          {totalProducts > 0 && (
            <div className="bg-card rounded-lg border p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Stock Distribution</h2>
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

          {/* Products Table + Add Button */}
          <div className="bg-card rounded-lg border overflow-hidden shadow-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Products</h2>
              <button
                onClick={openAddModal}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-6 py-3 font-semibold">ID</th>
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
                        No products yet. Click "Add Product" to create one.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p._id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                          {p._id || "—"}
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
                            <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-700 dark:text-green-400">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-700 dark:text-gray-400">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center flex justify-center gap-4">
                          <button
                            onClick={() => openEditModal(p)}
                            disabled={actionLoading}
                            className="text-accent hover:text-accent/80 disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            disabled={actionLoading}
                            className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                            title="Delete"
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

      {/* Add / Edit Modal */}
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-card p-6 text-left align-middle shadow-xl transition-all border">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6"
                  >
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Unique Product ID (e.g. P-001, ITEM-123)
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
                        placeholder="e.g. DeWalt 20V Cordless Drill"
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
                        placeholder="Powerful 20V MAX cordless drill/driver..."
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
                          placeholder="1000"
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
                          placeholder="https://images.unsplash.com/..."
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
    </div>
  );
}
