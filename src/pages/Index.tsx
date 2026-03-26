import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import CategoryGrid from '@/components/CategoryGrid';
import { vendors } from '@/lib/mock-data';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 pt-16 pb-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <MapPin className="h-4 w-4" />
              Delivering from your neighbourhood
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              Fresh from your
              <span className="text-primary"> local vendors</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Skip the warehouse. Buy directly from nearby shopkeepers and street vendors at the best prices.
            </p>
            <SearchBar large />
          </motion.div>

          {/* Floating emojis */}
          <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-20 left-[10%] text-4xl hidden lg:block">🥬</motion.span>
          <motion.span animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 0.5 }} className="absolute top-32 right-[12%] text-4xl hidden lg:block">🍎</motion.span>
          <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, delay: 1 }} className="absolute bottom-20 left-[15%] text-3xl hidden lg:block">🥛</motion.span>
          <motion.span animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }} className="absolute bottom-16 right-[18%] text-3xl hidden lg:block">🍞</motion.span>
        </div>
      </section>

      <CategoryGrid />

      {/* Nearby Vendors */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Nearby Vendors</h2>
            <Button variant="ghost" size="sm" className="text-primary" asChild>
              <Link to="/search">View All <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.filter(v => v.isOpen).slice(0, 3).map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/search?vendor=${vendor.id}`} className="block bg-card border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{vendor.avatar}</span>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{vendor.name}</h3>
                      <p className="text-xs text-muted-foreground">{vendor.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                      {vendor.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {vendor.distance}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-10">How LocalKart Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { emoji: '🔍', title: 'Search Products', desc: 'Find what you need from local vendors' },
              { emoji: '🛒', title: 'Compare & Add', desc: 'Compare prices across vendors and add to cart' },
              { emoji: '🚀', title: 'Get it Delivered', desc: 'Delivered straight from the vendor to your door' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <span className="text-4xl mb-3 block">{step.emoji}</span>
                <h3 className="font-display font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 LocalKart. Supporting local vendors, one order at a time. 🛒</p>
        </div>
      </footer>
    </div>
  );
}
