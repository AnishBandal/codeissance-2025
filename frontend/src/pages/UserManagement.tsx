import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Users, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CreateUserForm from '@/components/users/CreateUserForm';

const UserManagement: React.FC = () => {
  const { user, role } = useAuth();
  const [activeDialog, setActiveDialog] = useState<'nodal' | 'processing' | null>(null);

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to access user management.
        </AlertDescription>
      </Alert>
    );
  }

  const canCreateNodalOfficer = role === 'authority';
  const canCreateProcessingStaff = role === 'authority' || role === 'nodal';

  const handleUserCreated = () => {
    setActiveDialog(null);
    // Optionally refresh user list here if you have one
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Create and manage users based on your role permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <Shield className="h-6 w-6" />
        </div>
      </div>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>
            Based on your role: {user.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Create Nodal Officers</span>
              <span className={`px-2 py-1 rounded text-sm ${canCreateNodalOfficer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {canCreateNodalOfficer ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Create Processing Staff</span>
              <span className={`px-2 py-1 rounded text-sm ${canCreateProcessingStaff ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {canCreateProcessingStaff ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Creation Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Nodal Officer */}
        <Card className={!canCreateNodalOfficer ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Create Nodal Officer</span>
            </CardTitle>
            <CardDescription>
              Create a new Nodal Officer who can manage Processing Staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog 
              open={activeDialog === 'nodal'} 
              onOpenChange={(open) => setActiveDialog(open ? 'nodal' : null)}
            >
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={!canCreateNodalOfficer}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Nodal Officer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Nodal Officer</DialogTitle>
                </DialogHeader>
                <CreateUserForm
                  userType="nodal"
                  onSuccess={handleUserCreated}
                  onCancel={() => setActiveDialog(null)}
                />
              </DialogContent>
            </Dialog>
            
            {!canCreateNodalOfficer && (
              <p className="text-sm text-muted-foreground mt-2">
                Only Higher Authority users can create Nodal Officers
              </p>
            )}
          </CardContent>
        </Card>

        {/* Create Processing Staff */}
        <Card className={!canCreateProcessingStaff ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Create Processing Staff</span>
            </CardTitle>
            <CardDescription>
              Create a new Processing Staff member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog 
              open={activeDialog === 'processing'} 
              onOpenChange={(open) => setActiveDialog(open ? 'processing' : null)}
            >
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={!canCreateProcessingStaff}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Processing Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Processing Staff</DialogTitle>
                </DialogHeader>
                <CreateUserForm
                  userType="processing"
                  onSuccess={handleUserCreated}
                  onCancel={() => setActiveDialog(null)}
                />
              </DialogContent>
            </Dialog>
            
            {!canCreateProcessingStaff && (
              <p className="text-sm text-muted-foreground mt-2">
                Only Higher Authority and Nodal Officer users can create Processing Staff
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>
            Understanding the user creation hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <div>
                <h4 className="font-semibold">Higher Authority</h4>
                <p className="text-sm text-muted-foreground">
                  Can create and manage all users including Nodal Officers and Processing Staff
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div>
                <h4 className="font-semibold">Nodal Officer</h4>
                <p className="text-sm text-muted-foreground">
                  Can create and manage Processing Staff within their zone
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div>
                <h4 className="font-semibold">Processing Staff</h4>
                <p className="text-sm text-muted-foreground">
                  Can manage leads and perform processing tasks
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;