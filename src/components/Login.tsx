import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onToggleRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onToggleRegister }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <LogIn className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">HR Management System</CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to access your HR dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername" className="text-sm font-medium text-gray-700">
                Email or Username
              </Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="your.email@example.com or your_username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button 
              type="submit" 
              className="w-full h-10 font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Button 
              type="button" 
              onClick={onToggleRegister}
              className="w-full h-10 font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
