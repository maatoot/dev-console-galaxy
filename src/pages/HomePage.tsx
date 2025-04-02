
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Database, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-8">
        <motion.div 
          className="flex-1 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-api-primary to-api-secondary">
            API Hub & Marketplace
          </h1>
          <p className="text-xl text-gray-300">
            Discover, consume, and publish APIs all in one place. 
            The ultimate platform for API developers and consumers.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            {isAuthenticated ? (
              <Button asChild size="lg" className="bg-api-primary hover:bg-api-primary/90">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-api-primary hover:bg-api-primary/90">
                  <Link to="/login">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/register">
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
        <motion.div 
          className="flex-1"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-full h-80 bg-gradient-to-br from-api-primary/20 to-api-secondary/20 rounded-lg border border-gray-700 flex items-center justify-center">
            <div className="text-center p-6 bg-api-dark/80 rounded-md backdrop-blur-sm">
              <Code size={60} className="mx-auto mb-4 text-api-primary" />
              <p className="text-xl font-semibold">Developer-First API Platform</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8 md:px-16 bg-gradient-to-b from-transparent to-api-dark/50">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need for API Success</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Database className="h-10 w-10 text-api-primary" />,
              title: "API Hub",
              description: "Browse and discover APIs from various providers. Find the perfect API for your project needs."
            },
            {
              icon: <Code className="h-10 w-10 text-api-secondary" />,
              title: "Developer Console",
              description: "Manage your API subscriptions, keys, and monitor usage all in one place."
            },
            {
              icon: <Zap className="h-10 w-10 text-api-accent" />,
              title: "Provider Studio",
              description: "Publish your APIs, manage versions, and grow your audience of developers."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card p-6 rounded-lg border border-border hover:border-api-primary/50 transition-all shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-8 md:px-16 text-center">
        <motion.div
          className="max-w-3xl mx-auto space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold">Ready to Start?</h2>
          <p className="text-xl text-gray-300">
            Join our community of API providers and consumers today. Explore, 
            publish, and integrate APIs with ease.
          </p>
          <Button asChild size="lg" className="mt-6 bg-api-primary hover:bg-api-primary/90">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Go to Dashboard" : "Sign Up Now"} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
