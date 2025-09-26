import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Shield, ShieldCheck, ShieldOff, RefreshCw, Copy, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { authService } from '../../services/authService';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFAStatus {
  enabled: boolean;
  backupCodesRemaining: number;
  hasSecret: boolean;
}

const TwoFactorManagement: React.FC = () => {
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [showDisable, setShowDisable] = useState<boolean>(false);
  const [showRegenerate, setShowRegenerate] = useState<boolean>(false);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const { toast } = useToast();

  // Load 2FA status on component mount
  useEffect(() => {
    load2FAStatus();
  }, []);

  const load2FAStatus = async () => {
    try {
      setLoading(true);
      const response = await authService.get2FAStatus();
      
      if (response.success && response.data) {
        setStatus(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load 2FA status',
        description: error.response?.data?.message || 'Unable to check 2FA status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationToken || verificationToken.length < 6) {
        setError('Please enter a valid verification code');
        return;
      }

      const response = await authService.disable2FA(verificationToken);
      
      if (response.success) {
        toast({
          title: '2FA Disabled',
          description: 'Two-factor authentication has been disabled for your account',
        });
        
        setStatus({ enabled: false, backupCodesRemaining: 0, hasSecret: false });
        setShowDisable(false);
        setVerificationToken('');
      }

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to disable 2FA');
      toast({
        title: 'Failed to disable 2FA',
        description: error.response?.data?.message || 'Unable to disable 2FA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationToken || verificationToken.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      const response = await authService.regenerateBackupCodes(verificationToken);
      
      if (response.success && response.data) {
        setNewBackupCodes(response.data.backupCodes);
        setShowRegenerate(false);
        setVerificationToken('');
        
        // Refresh status to update backup codes count
        await load2FAStatus();
        
        toast({
          title: 'Backup Codes Regenerated',
          description: 'New backup codes have been generated. Your old codes are no longer valid.',
        });
      }

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to regenerate backup codes');
      toast({
        title: 'Failed to regenerate codes',
        description: error.response?.data?.message || 'Unable to regenerate backup codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = newBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast({
      title: 'Backup Codes Copied',
      description: 'Store them in a secure location',
    });
  };

  const downloadBackupCodes = () => {
    const codesText = `LeadVault 2FA Backup Codes\nRegenerated: ${new Date().toLocaleString()}\n\n${newBackupCodes.join('\n')}\n\nImportant:\n- Each code can only be used once\n- Store these codes securely\n- Your old backup codes are no longer valid`;
    
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

  // Show setup component if 2FA is not enabled
  if (showSetup || (!status?.enabled && !loading)) {
    return <TwoFactorSetup />;
  }

  if (loading && !status) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading 2FA status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status?.enabled ? (
                <ShieldCheck className="h-6 w-6 text-green-600" />
              ) : (
                <ShieldOff className="h-6 w-6 text-red-600" />
              )}
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <CardDescription>
            {status?.enabled 
              ? 'Your account is protected with two-factor authentication'
              : 'Add an extra layer of security to your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">2FA is active</p>
                  <p className="text-xs text-green-600">
                    Backup codes remaining: {status.backupCodesRemaining}
                  </p>
                </div>
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>

              {status.backupCodesRemaining <= 2 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have {status.backupCodesRemaining} backup codes remaining. 
                    Consider regenerating new codes.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerate(true)}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Backup Codes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisable(true)}
                  className="flex items-center gap-2"
                >
                  <ShieldOff className="h-4 w-4" />
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your account is not protected with two-factor authentication. 
                  Enable 2FA to improve your account security.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Enable 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Modal */}
      {showDisable && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Disable Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter a verification code to disable 2FA for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: Disabling 2FA will make your account less secure. 
                You can re-enable it at any time.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="disable-token">
                Enter 6-digit code from your authenticator app or backup code
              </Label>
              <Input
                id="disable-token"
                type="text"
                placeholder="000000"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={8}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisable(false);
                  setVerificationToken('');
                  setError('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={loading || !verificationToken}
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Backup Codes Modal */}
      {showRegenerate && (
        <Card>
          <CardHeader>
            <CardTitle>Regenerate Backup Codes</CardTitle>
            <CardDescription>
              Generate new backup codes and invalidate your current ones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will generate 10 new backup codes and invalidate all your current backup codes.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="regen-token">
                Enter 6-digit code from your authenticator app
              </Label>
              <Input
                id="regen-token"
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRegenerate(false);
                  setVerificationToken('');
                  setError('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegenerateBackupCodes}
                disabled={loading || verificationToken.length !== 6}
              >
                {loading ? 'Generating...' : 'Generate New Codes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Backup Codes Display */}
      {newBackupCodes.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">New Backup Codes Generated</CardTitle>
            <CardDescription>
              Save these codes in a secure location. Your old backup codes are no longer valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border">
              {newBackupCodes.map((code, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="font-mono justify-center py-2"
                >
                  {code}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
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
              <Button 
                onClick={() => setNewBackupCodes([])}
                className="ml-auto"
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TwoFactorManagement;
