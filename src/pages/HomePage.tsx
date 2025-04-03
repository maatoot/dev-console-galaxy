
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Database, Zap, Package, Send, Key, MousePointerClick } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const HomePage = () => {
  const { isAuthenticated, userRole } = useAuth();

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
              <>
                <Button asChild size="lg" className="bg-api-primary hover:bg-api-primary/90">
                  <Link to="/apis">
                    Browse APIs <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {userRole === 'provider' && (
                  <Button asChild size="lg" variant="outline">
                    <Link to="/apis">
                      Publish an API <Package className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild size="lg" className="bg-api-primary hover:bg-api-primary/90">
                  <Link to="/apis">
                    Browse APIs <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Quick Access Section */}
      <section className="py-8 px-8 md:px-16">
        <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 hover:bg-card/70 transition-colors cursor-pointer" onClick={() => window.location.href = "/apis"}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Package className="h-12 w-12 text-api-primary mb-4" />
              <h3 className="text-lg font-medium">Browse APIs</h3>
              <p className="text-muted-foreground mt-2">Explore our marketplace of available APIs</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 hover:bg-card/70 transition-colors cursor-pointer" onClick={() => window.location.href = "/tester"}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Send className="h-12 w-12 text-api-secondary mb-4" />
              <h3 className="text-lg font-medium">API Tester</h3>
              <p className="text-muted-foreground mt-2">Test API endpoints with our integrated tool</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 hover:bg-card/70 transition-colors cursor-pointer" onClick={() => window.location.href = isAuthenticated ? "/subscriptions" : "/login"}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Key className="h-12 w-12 text-api-accent mb-4" />
              <h3 className="text-lg font-medium">Your Subscriptions</h3>
              <p className="text-muted-foreground mt-2">Manage your API subscriptions and keys</p>
            </CardContent>
          </Card>
        </div>
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
              icon: <MousePointerClick className="h-10 w-10 text-api-accent" />,
              title: "Interactive Testing",
              description: "Test APIs directly in your browser with our powerful API testing tool."
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
            <Link to={isAuthenticated ? "/apis" : "/register"}>
              {isAuthenticated ? "Browse APIs" : "Sign Up Now"} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
