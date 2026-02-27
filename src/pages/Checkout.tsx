"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/components/ProductCard";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";

const API_BASE = "https://dolly-backend-fjlu.onrender.com";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isEmpty = items.length === 0 && !success;

  if (isEmpty) {
    navigate("/cart");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
        })),
        totalAmount: totalPrice,
        status: "Pending",
        paymentMethod: "Manual / Phone",
        notes: "",
      };

      // Optional: helpful for debugging – remove later if you want
      console.log("Sending order data:", orderData);

      const response = await axios.post(`${API_BASE}/orders`, orderData, {
        timeout: 30000,
      });

      if (response.status === 201) {
        setSuccess(true);
        clearCart();
        toast.success("Order placed successfully! We'll contact you shortly.");
      }
    } catch (err: any) {
      console.error("Order submission error:", err);

      let errorMsg = "Failed to place order. Please try again.";

      if (err.response) {
        if (err.response.status === 400) {
          errorMsg = err.response.data?.error || "Invalid order data (check product details)";
        } else if (err.response.status === 404) {
          errorMsg = "Backend endpoint not found. Contact support.";
        } else if (err.response.status >= 500) {
          errorMsg = "Server error – please try again later.";
        }
      }

      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" />
        <h1 className="section-heading mb-2">Order Placed!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you, {form.name}. We have received your order and will call you at{" "}
          {form.phone} shortly to confirm payment and delivery details.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="btn-accent inline-flex items-center gap-2"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="section-heading mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delivery Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="font-display font-semibold text-lg text-card-foreground mb-4">
              Delivery Information
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  placeholder="+254 700 000 000"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  className="w-full px-4 py-2.5 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Delivery Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
                  placeholder="123 Main Street, Nairobi"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-accent w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              `Place Order — ${formatPrice(totalPrice)}`
            )}
          </button>
        </form>

        {/* Order Summary */}
        <div className="bg-card rounded-lg border p-6 h-fit sticky top-24">
          <h2 className="font-display font-semibold text-lg text-card-foreground mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                </div>
                <span className="text-sm font-medium text-foreground shrink-0">
                  {formatPrice(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;