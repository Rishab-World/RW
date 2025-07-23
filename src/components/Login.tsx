import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Users, Shield, Building2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onToggleRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onToggleRegister }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Check if input is email or username
      const isEmail = emailOrUsername.includes('@');
      let email = emailOrUsername;

      if (!isEmail) {
        // If username, fetch the email from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', emailOrUsername)
          .single();

        if (userError) throw new Error('Username not found');
        email = userData.id; // Use the user's ID (which is their email in Supabase Auth)
      }

      // Sign in with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Left Side - Branding and Features */}
              <div className="hidden lg:flex lg:w-1/2 bg-amber-600 dark:bg-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold">RW HR Portal</h1>
            </div>
            <p className="text-xl font-medium mb-2">Welcome to your HR Management System</p>
            <p className="text-amber-100 text-lg">Streamline your human resources operations with our comprehensive platform.</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Employee Management</h3>
                <p className="text-amber-100 text-sm">Comprehensive employee data and lifecycle management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Reliable</h3>
                <p className="text-amber-100 text-sm">Enterprise-grade security with role-based access control</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Easy Access</h3>
                <p className="text-amber-100 text-sm">Quick login with email or username authentication</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative">
        {/* Theme Toggle - Top Right */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-600 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">RW HR Portal</h1>
            </div>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:border-slate-700/50">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-amber-600 dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <LogIn className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">Welcome Back</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
                Sign in to access your HR dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
                             <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Email or Username
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      id="emailOrUsername"
                      type="text"
                      placeholder="Enter your email or username"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      required
                      className="h-11 pl-10 pr-4 border-slate-200 dark:border-slate-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
                
                                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pl-10 pr-12 border-slate-200 dark:border-slate-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      {error}
                    </p>
                  </div>
                )}
                
                                                 <Button 
                  type="submit" 
                  className="w-full h-11 font-semibold bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">New to the platform?</span>
                  </div>
                </div>
                
                                                 <Button 
                  type="button" 
                  onClick={onToggleRegister}
                  className="w-full h-11 font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-xl transition-all duration-200"
                >
                  Create New Account
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © 2024 RW HR Portal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
