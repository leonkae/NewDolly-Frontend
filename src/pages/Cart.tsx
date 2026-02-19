import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/components/ProductCard";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="section-heading mb-2">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven't added any items yet.</p>
        <Link to="/products" className="btn-accent inline-flex items-center gap-2">
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="section-heading mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-card rounded-lg border p-4 flex gap-4">
              <Link to={`/products/${product.id}`} className="shrink-0">
                <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-md" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${product.id}`} className="font-semibold text-card-foreground hover:text-accent transition-colors">
                  {product.name}
                </Link>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                <p className="font-bold text-foreground mt-1">{formatPrice(product.price)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeFromCart(product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border rounded-md">
                  <button onClick={() => updateQuantity(product.id, quantity - 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-2 py-1 text-sm font-medium text-foreground">{quantity}</span>
                  <button onClick={() => updateQuantity(product.id, quantity + 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-lg border p-6 h-fit sticky top-24">
          <h2 className="font-display font-semibold text-lg text-card-foreground mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-muted-foreground">
                <span className="truncate mr-2">{product.name} × {quantity}</span>
                <span className="shrink-0">{formatPrice(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-foreground text-lg">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <Link to="/checkout" className="btn-accent w-full mt-6 text-center block">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
