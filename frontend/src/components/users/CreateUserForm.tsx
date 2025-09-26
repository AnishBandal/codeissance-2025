import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { userService, CreateUserRequest } from '@/services/userService';

interface CreateUserFormProps {
  userType: 'nodal' | 'processing';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ 
  userType, 
  onSuccess, 
  onCancel 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    role: userType === 'nodal' ? 'Nodal Officer' : 'Processing Staff',
    zone: user?.zone || '',
    region: '',
    permissions: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  const availableZones = userService.getAvailableZones();
  const availableRegions = userService.getAvailableRegions(formData.zone);

  // Password strength validation
  const validatePassword = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('At least one uppercase letter');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('At least one lowercase letter');

    if (/\d/.test(password)) score += 1;
    else feedback.push('At least one number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('At least one special character');

    setPasswordStrength({ score, feedback });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));
    validatePassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordStrength.score < 5) {
      toast({
        title: "Weak Password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = userType === 'nodal' 
        ? await userService.createNodalOfficer(formData)
        : await userService.createProcessingStaff(formData);

      if (response.success) {
        toast({
          title: "User Created Successfully",
          description: `${formData.role} ${formData.username} has been created.`,
        });
        
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          role: userType === 'nodal' ? 'Nodal Officer' : 'Processing Staff',
          zone: user?.zone || '',
          region: '',
          permissions: []
        });
        
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to create user');
      }
    } catch (error: any) {
      toast({
        title: "Error Creating User",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score < 2) return 'bg-red-500';
    if (passwordStrength.score < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score < 2) return 'Weak';
    if (passwordStrength.score < 4) return 'Medium';
    return 'Strong';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          Create {userType === 'nodal' ? 'Nodal Officer' : 'Processing Staff'}
        </CardTitle>
        <CardDescription>
          {userType === 'nodal' 
            ? 'Create a new Nodal Officer who can manage Processing Staff'
            : 'Create a new Processing Staff member'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handlePasswordChange}
              required
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getPasswordStrengthText()}</span>
                </div>
                
                {passwordStrength.feedback.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Zone */}
          <div className="space-y-2">
            <Label htmlFor="zone">Zone</Label>
            <Select 
              value={formData.zone} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, zone: value, region: '' }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {availableZones.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select 
              value={formData.region} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
              disabled={!formData.zone}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Input 
              value={formData.role} 
              readOnly 
              className="bg-gray-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || passwordStrength.score < 5}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateUserForm;