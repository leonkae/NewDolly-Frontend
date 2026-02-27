import { Wrench, Phone, MapPin, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-6 w-6 text-accent" />
              <span className="font-display text-lg font-bold">
                Dolly's <span className="text-accent">Hardware</span>
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Your trusted local hardware store since 2010. Quality tools, materials, and expert advice for every project.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-accent mb-4">Quick Links</h3>
            <div className="space-y-2">
              {[
                { to: "/", label: "Home" },
                { to: "/products", label: "Products" },
                { to: "/cart", label: "Cart" },
                { to: "/admin", label: "Admin" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="block text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-accent mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent shrink-0" />
                <span>Fedha Estate</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <span>+254 29 724 925</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent shrink-0" />
                <span>stevetunechi95@gmail.com</span>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-navy-light mt-8 pt-6 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Dolly's Hardware. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
