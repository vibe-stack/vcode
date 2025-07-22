import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Github, Twitter, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/vibes-api';

interface SignInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInSheet({ open, onOpenChange }: SignInSheetProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const res = await authClient.signIn.email({
          email,
          password,
        });
        if (res?.data?.user) {
          onOpenChange(false);
          setEmail('');
          setPassword('');
          setUsername('');
        } else {
          setError(res?.error || 'Sign in failed');
        }
      } else {
        const res = await authClient.signUp.email({
          email,
          password,
          name: username,
        });
        if (res?.data?.user) {
          onOpenChange(false);
          setEmail('');
          setPassword('');
          setUsername('');
        } else {
          setError(res?.error || 'Sign up failed');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: 'github' | 'twitter') => {
    clearError();
    setIsLoading(true);
    try {
      if (provider === 'twitter') {
        await authClient.signIn.social({
            provider: 'twitter',
        });
      } else {
        // Github is disabled for now
      }
    } catch (err: any) {
      setError(err?.message || 'Provider sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    clearError();
  };

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[400px] p-4">
        <SheetHeader>
          <SheetTitle>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'signin' 
              ? 'Welcome back! Please sign in to your account.' 
              : 'Create a new account to get started.'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Providers */}
          <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={true}
            title="GitHub sign-in is currently disabled"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub (Disabled)
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleProviderSignIn('twitter')}
            disabled={isLoading}
          >
            <Twitter className="mr-2 h-4 w-4" />
            Continue with X
          </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Mode Toggle */}
          <div className="text-center text-sm">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={() => handleModeChange('signup')}
                  disabled={isLoading}
                >
                  Create one
                </Button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={() => handleModeChange('signin')}
                  disabled={isLoading}
                >
                  Sign in
                </Button>
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
