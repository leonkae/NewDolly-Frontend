import { useState } from "react";
import { Lock, Package, ShoppingBag, DollarSign } from "lucide-react";
import { products } from "@/data/products";
import { formatPrice } from "@/components/ProductCard";

const AdminDashboard = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple demo auth - in production this would be JWT-based
    if (password === "admin123") {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password. (Hint: admin123)");
    }
  };

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-sm animate-fade-in">
        <div className="bg-card rounded-lg border p-8 text-center">
          <Lock className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-card-foreground mb-2">Admin Access</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter password to continue</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button type="submit" className="btn-accent w-full">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const inStock = products.filter((p) => p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-heading">Admin Dashboard</h1>
        <button onClick={() => setAuthenticated(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Package, label: "Total Products", value: products.length.toString(), color: "text-accent" },
          { icon: ShoppingBag, label: "In Stock", value: inStock.toString(), color: "text-emerald-500" },
          { icon: Package, label: "Out of Stock", value: outOfStock.toString(), color: "text-destructive" },
          { icon: DollarSign, label: "Inventory Value", value: formatPrice(totalValue), color: "text-accent" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card rounded-lg border p-5">
            <div className="flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-card-foreground">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-card-foreground">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-card-foreground">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-card-foreground">Price</th>
                <th className="text-right px-4 py-3 font-semibold text-card-foreground">Stock</th>
                <th className="text-center px-4 py-3 font-semibold text-card-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-card-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    {p.stock === 0 ? (
                      <span className="badge-stock-out">Out</span>
                    ) : p.stock <= 5 ? (
                      <span className="badge-stock-low">Low</span>
                    ) : (
                      <span className="badge-stock-in">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
