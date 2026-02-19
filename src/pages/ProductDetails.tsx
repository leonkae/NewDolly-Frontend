import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { formatPrice, getStockBadge } from "@/components/ProductCard";
import { useState } from "react";

const ProductDetails = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <h1 className="section-heading mb-4">Product Not Found</h1>
        <Link to="/products" className="text-accent hover:text-orange-hover font-medium">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <Link to="/products" className="inline-flex items-center gap-1 text-muted-foreground hover:text-accent text-sm mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{product.category}</span>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">{product.name}</h1>
          <div className="mt-2">{getStockBadge(product.stock)}</div>
          <p className="text-2xl font-bold text-foreground mt-4">{formatPrice(product.price)}</p>
          <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

          {product.stock > 0 && (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border rounded-md">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium text-foreground min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => addToCart(product, qty)} className="btn-accent flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
