import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, Smartphone, Key } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { authService } from '../../services/authService';

interface TwoFactorLoginProps {
  userId: string;
  username: string;
  onSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({
  userId,
  username,
  onSuccess,
  onBack
}) => {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [useBackupCode, setUseBackupCode] = useState<boolean>(false);
  const { toast } = useToast();

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token || (useBackupCode ? token.length < 6 : token.length !== 6)) {
        setError(useBackupCode ? 'Please enter a valid backup code' : 'Please enter a valid 6-digit code');
        return;
      }

      const response = await authService.loginWith2FA(userId, token);

      if (response.success && response.data) {
        toast({
          title: 'Login Successful',
          description: response.message || '2FA verification completed',
        });

        onSuccess(response.data.user, response.data.token);
      } else {
        setError(response.message || 'Invalid 2FA code');
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify 2FA code';
      setError(errorMessage);
      
      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTokenChange = (value: string) => {
    if (useBackupCode) {
      // Backup codes are alphanumeric, 8 characters
      setToken(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
    } else {
      // TOTP tokens are 6 digits
      setToken(value.replace(/\D/g, '').slice(0, 6));
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setToken('');
    setError('');
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Enter the verification code for <strong>{username}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          {useBackupCode ? (
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
              <Key className="h-5 w-5" />
              <span className="text-sm font-medium">Using Backup Code</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
              <Smartphone className="h-5 w-5" />
              <span className="text-sm font-medium">Authenticator App</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="verification-token">
            {useBackupCode ? 'Enter backup code' : 'Enter 6-digit code from your authenticator app'}
          </Label>
          <Input
            id="verification-token"
            type="text"
            placeholder={useBackupCode ? "ABCD1234" : "000000"}
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            className="text-center text-lg font-mono tracking-wider"
            maxLength={useBackupCode ? 8 : 6}
            autoComplete="one-time-code"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleVerify2FA}
            disabled={loading || !token || (useBackupCode ? token.length < 6 : token.length !== 6)}
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={toggleBackupCode}
              className="text-sm"
            >
              {useBackupCode ? 'Use authenticator app instead' : "Can't access your device? Use backup code"}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="w-full"
          >
            Back to Login
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>
            {useBackupCode 
              ? 'Each backup code can only be used once.'
              : 'Open your authenticator app and enter the current 6-digit code.'
            }
          </p>
          {!useBackupCode && (
            <p>Codes refresh every 30 seconds.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorLogin;
