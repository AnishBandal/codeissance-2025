import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/contexts/RoleContext';
import { mockLeads, mockAuditLogs, Lead } from '@/data/mockData';
import { 
  ArrowLeft, 
  Edit,
  Save,
  User,
  Phone,
  Mail,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  History,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentRole, currentUser } = useRole();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Find the lead
  const lead = mockLeads.find(l => l.id === id);
  
  const [editedLead, setEditedLead] = useState<Lead | null>(lead || null);

  if (!lead || !editedLead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="boi-card max-w-md">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Not Found</h3>
            <p className="text-gray-600 mb-4">
              The requested lead could not be found.
            </p>
            <Button onClick={() => navigate('/leads')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get audit logs for this lead
  const leadAuditLogs = mockAuditLogs.filter(log => log.leadId === lead.id);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Mock save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Lead Updated",
      description: "Lead information has been successfully updated",
    });
    
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleStatusChange = (newStatus: string) => {
    setEditedLead(prev => prev ? { ...prev, status: newStatus as Lead['status'] } : null);
  };

  const handleAssignment = (newAssignee: string) => {
    setEditedLead(prev => prev ? { ...prev, assignedTo: newAssignee } : null);
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 80) {
      return <Badge variant="destructive" className="text-sm">High Priority</Badge>;
    } else if (score >= 60) {
      return <Badge variant="default" className="text-sm">Medium Priority</Badge>;
    } else {
      return <Badge variant="secondary" className="text-sm">Low Priority</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-purple-100 text-purple-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Completed': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={`text-sm ${statusColors[status] || ''}`}>
        {status}
      </Badge>
    );
  };

  const canEdit = currentRole === 'processing' || currentRole === 'nodal';
  const canAssign = currentRole === 'nodal' || currentRole === 'authority';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Details - {lead.id}</h1>
            <p className="text-gray-600">{lead.customerName}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {canEdit && (
            <>
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isSaving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Lead
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input
                    id="customerName"
                    value={editedLead.customerName}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, customerName: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="customerAge">Age</Label>
                  <Input
                    id="customerAge"
                    value={editedLead.customerAge}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, customerAge: parseInt(e.target.value) } : null)}
                    disabled={!isEditing}
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={editedLead.phone}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      value={editedLead.email}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, email: e.target.value } : null)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={editedLead.customerOccupation}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, customerOccupation: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="income">Annual Income</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="income"
                      value={editedLead.customerIncome}
                      onChange={(e) => setEditedLead(prev => prev ? { ...prev, customerIncome: e.target.value } : null)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Information */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-orange-600" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productType">Product Type</Label>
                  <Select 
                    value={editedLead.productType} 
                    onValueChange={(value) => setEditedLead(prev => prev ? { ...prev, productType: value } : null)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home Loan">Home Loan</SelectItem>
                      <SelectItem value="Car Loan">Car Loan</SelectItem>
                      <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                      <SelectItem value="Business Loan">Business Loan</SelectItem>
                      <SelectItem value="Education Loan">Education Loan</SelectItem>
                      <SelectItem value="Gold Loan">Gold Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    id="loanAmount"
                    value={editedLead.loanAmount}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, loanAmount: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={editedLead.region}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, region: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="creditScore">Credit Score</Label>
                  <Input
                    id="creditScore"
                    value={editedLead.creditScore}
                    onChange={(e) => setEditedLead(prev => prev ? { ...prev, creditScore: parseInt(e.target.value) } : null)}
                    disabled={!isEditing}
                    type="number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2 text-purple-600" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0 mt-1">
                      {log.action === 'Lead Created' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {log.action === 'Status Updated' && <Clock className="w-4 h-4 text-blue-600" />}
                      {log.action === 'Assignment Changed' && <UserCheck className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{log.action}</span>
                        <span className="text-sm text-gray-500">by {log.user}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <div className="mt-2">
                  {canEdit && isEditing ? (
                    <Select value={editedLead.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(editedLead.status)
                  )}
                </div>
              </div>

              <div>
                <Label>Priority Level</Label>
                <div className="mt-2 flex items-center space-x-2">
                  {getPriorityBadge(editedLead.priorityScore)}
                  <span className="text-sm text-gray-600">({editedLead.priorityScore})</span>
                </div>
              </div>

              {canAssign && (
                <div>
                  <Label>Assigned To</Label>
                  <div className="mt-2">
                    {isEditing ? (
                      <Select value={editedLead.assignedTo} onValueChange={handleAssignment}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Amit Singh">Amit Singh</SelectItem>
                          <SelectItem value="Priya Sharma">Priya Sharma</SelectItem>
                          <SelectItem value="Rajesh Gupta">Rajesh Gupta</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-sm">
                        {editedLead.assignedTo}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800 font-medium mb-1">Risk Assessment</p>
                <p className="text-xs text-purple-700">{editedLead.aiInsight}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Credit Score:</span>
                  <span className={`font-medium ${editedLead.creditScore >= 700 ? 'text-green-600' : 'text-orange-600'}`}>
                    {editedLead.creditScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Age Factor:</span>
                  <span className="font-medium">
                    {editedLead.customerAge >= 25 && editedLead.customerAge <= 45 ? 'Optimal' : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Income Level:</span>
                  <span className="font-medium text-green-600">Good</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {editedLead.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{doc}</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Info */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Created Date:</span>
                <span className="font-medium">{editedLead.createdDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium">{editedLead.lastUpdated}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Time:</span>
                <span className="font-medium">
                  {Math.ceil((new Date().getTime() - new Date(editedLead.createdDate).getTime()) / (1000 * 3600 * 24))} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;