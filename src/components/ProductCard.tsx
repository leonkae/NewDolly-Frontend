import { Product } from "@/types";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

const getStockBadge = (stock: number) => {
  if (stock === 0) return <span className="badge-stock-out">Out of Stock</span>;
  if (stock <= 5) return <span className="badge-stock-low">Low Stock ({stock})</span>;
  return <span className="badge-stock-in">In Stock</span>;
};

const formatPrice = (price: number) => {
  return `KSh ${price.toLocaleString()}`;
};

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();

  return (
    <div className="card-product group">
      <Link to={`/products/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.category}
          </span>
          {getStockBadge(product.stock)}
        </div>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-card-foreground mt-1 hover:text-accent transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="btn-accent !px-3 !py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-1.5"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export { formatPrice, getStockBadge };
export default ProductCard;
