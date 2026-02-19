import { Link } from "react-router-dom";
import { ArrowRight, Shield, Truck, Clock } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import heroImage from "@/assets/hero-hardware.jpg";

const featuredProducts = products.filter((p) => p.featured).slice(0, 4);

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <img
          src={heroImage}
          alt="Dolly's Hardware Store"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/90 via-navy-dark/70 to-transparent" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Build It Right with{" "}
              <span className="text-accent">Dolly's</span>
            </h1>
            <p className="mt-4 text-primary-foreground/80 text-lg md:text-xl max-w-md">
              Quality tools, materials, and expert advice for every project — big or small.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-accent text-base flex items-center gap-2">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/products"
                className="px-6 py-3 rounded-md border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-colors text-base font-medium"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: "Fast Delivery", desc: "Same-day delivery in Nairobi" },
              { icon: Shield, title: "Quality Guarantee", desc: "Genuine products, always" },
              { icon: Clock, title: "Expert Support", desc: "Mon-Sat, 7AM - 7PM" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 px-4 py-3">
                <div className="bg-orange-light rounded-lg p-3">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-heading">Featured Products</h2>
          <Link
            to="/products"
            className="text-accent hover:text-orange-hover font-medium text-sm flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            Need Help With Your Project?
          </h2>
          <p className="text-primary-foreground/70 max-w-md mx-auto mb-6">
            Our team of experts is ready to help you find the right tools and materials.
          </p>
          <Link to="/products" className="btn-accent inline-flex items-center gap-2 text-base">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
