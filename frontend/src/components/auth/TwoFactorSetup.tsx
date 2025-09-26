import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Shield, Smartphone, Key, Copy, Download, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { authService } from '../../services/authService';

const TwoFactorSetup: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  // Generate QR code and setup data
  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authService.setup2FA();
      
      setQrCode(response.data.qrCode);
      setManualKey(response.data.manualEntryKey);
      setStep('verify');
      
      toast({
        title: '2FA Setup Initiated',
        description: 'Scan the QR code with your authenticator app',
      });

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to setup 2FA');
      toast({
        title: 'Setup Failed',
        description: error.response?.data?.message || 'Failed to setup 2FA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify token and enable 2FA
  const handleVerifyAndEnable = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationToken || verificationToken.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      const response = await authService.enable2FA(verificationToken);
      
      setBackupCodes(response.data.backupCodes);
      setStep('complete');
      
      toast({
        title: '2FA Enabled Successfully!',
        description: 'Please save your backup codes securely',
      });

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to enable 2FA');
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy manual key to clipboard
  const copyManualKey = () => {
    navigator.clipboard.writeText(manualKey);
    toast({
      title: 'Copied!',
      description: 'Manual entry key copied to clipboard',
    });
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast({
      title: 'Backup Codes Copied',
      description: 'Store them in a secure location',
    });
  };

  // Download backup codes as text file
  const downloadBackupCodes = () => {
    const codesText = `LeadVault 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nImportant:\n- Each code can only be used once\n- Store these codes securely\n- You can regenerate new codes from your settings`;
    
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadvault-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Backup Codes Downloaded',
      description: 'File saved to your downloads folder',
    });
  };

  if (step === 'setup') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>Enable Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Smartphone className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Authenticator App Required</h4>
                <p className="text-sm text-gray-600 mt-1">
                  You'll need an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Key className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Enhanced Security</h4>
                <p className="text-sm text-gray-600 mt-1">
                  2FA adds an extra security layer, requiring both your password and a time-based code.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleSetup2FA}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Setting up...' : 'Setup 2FA'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app, then enter the verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {qrCode && (
              <div className="inline-block p-4 bg-white border rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Manual Entry (if you can't scan)</Label>
            <div className="flex gap-2">
              <Input 
                value={manualKey} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyManualKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="verification-token">Enter 6-digit code from your app</Label>
            <Input
              id="verification-token"
              type="text"
              placeholder="000000"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg font-mono tracking-wider"
              maxLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep('setup')}
              disabled={loading}
            >
              Back
            </Button>
            <Button 
              onClick={handleVerifyAndEnable}
              disabled={loading || verificationToken.length !== 6}
              className="flex-1"
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-700">2FA Enabled Successfully!</CardTitle>
          </div>
          <CardDescription>
            Your account is now protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Save these backup codes in a secure location. 
              Each code can only be used once and will allow you to access your account 
              if you lose your authenticator device.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Backup Codes</Label>
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border">
              {backupCodes.map((code, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="font-mono justify-center py-2"
                >
                  {code}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={copyBackupCodes}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Codes
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadBackupCodes}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              You can now close this setup. Your 2FA is active and will be required for future logins.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default TwoFactorSetup;
