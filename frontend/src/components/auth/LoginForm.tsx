import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import TwoFactorLogin from './TwoFactorLogin';
import { authService } from '@/services/authService';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, complete2FALogin, isLoading, error, clearError, clear2FA, requires2FA, twoFAData } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Monitor 2FA state changes
  React.useEffect(() => {
    // 2FA state monitoring for debugging if needed
  }, [requires2FA, twoFAData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    try {
      await login(formData.username, formData.password);
      
      // If login doesn't throw and no 2FA is required, call onSuccess
      if (!requires2FA) {
        onSuccess?.();
      }
      // If 2FA is required, the AuthContext has set the requires2FA state
      // and the component will re-render to show the 2FA form
    } catch (err: any) {
      console.error('Login error:', err);
      // Any other errors are handled by AuthContext
    }
  };

  const handle2FASuccess = async (user: any, token: string) => {
    try {
      await complete2FALogin(user, token);
      onSuccess?.();
    } catch (err) {
      console.error('2FA completion error:', err);
    }
  };

  const handleBackToLogin = () => {
    clear2FA();
    clearError();
  };

  // If 2FA is required, show the 2FA component
  if (requires2FA && twoFAData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LeadVault</h1>
            <p className="text-gray-600">Lead Management System</p>
          </div>

          {/* 2FA Information */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>2FA Required for:</strong> {twoFAData.username}
            </p>
            <p className="text-xs text-blue-600">Please enter your authenticator code</p>
          </div>

          <TwoFactorLogin
            userId={twoFAData.userId}
            username={twoFAData.username}
            onSuccess={handle2FASuccess}
            onBack={handleBackToLogin}
          />

          <div className="text-center text-xs text-gray-500">
            <p>© 2024 LeadVault. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render regular login form

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LeadVault</h1>
          <p className="text-gray-600">Lead Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Demo Credentials (All users require 2FA):</p>
              <div className="mt-2 space-y-1 text-xs">
                <p><strong>Higher Authority:</strong> admin / Admin123!</p>
                <p><strong>Nodal Officer:</strong> nodal_zone_a / Nodal123!</p>
                <p><strong>Processing Staff:</strong> staff_alice / Staff123!</p>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                <p>💡 Use Google/Microsoft Authenticator with the setup keys provided</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>© 2024 LeadVault. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;