import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { leadService, type BackendLead } from '@/services/leadService';
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
  Sparkles,
  Send,
  Loader2,
  Eye,
  Download
} from 'lucide-react';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  
  const [lead, setLead] = useState<BackendLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [isSendingRemarks, setIsSendingRemarks] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    productType: '',
    status: '',
    loanAmount: '',
    customerAge: 0,
    customerOccupation: '',
    customerIncome: '',
    region: '',
    aiInsight: ''
  });

  // Load lead data
  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await leadService.getLeadById(id);
        if (response.success) {
          const leadData = response.data.lead;
          setLead(leadData);
          
          // Initialize edit form
          setEditForm({
            customerName: leadData.customerName || '',
            email: leadData.email || '',
            phone: leadData.phone || '',
            productType: leadData.productType || '',
            status: leadData.status || '',
            loanAmount: leadData.loanAmount || '',
            customerAge: leadData.customerAge || 0,
            customerOccupation: leadData.customerOccupation || '',
            customerIncome: leadData.customerIncome || '',
            region: leadData.region || '',
            aiInsight: leadData.aiInsight || ''
          });
        } else {
          console.error('API Response Error:', response);
          throw new Error(response.message || 'Failed to fetch lead');
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
        toast({
          title: "Error",
          description: "Failed to load lead details. Please try again.",
          variant: "destructive",
        });
        navigate('/leads');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      const response = await leadService.updateLead(id, editForm);
      if (response.success) {
        setLead(response.data.lead);
        
        const emailStatus = response.data.emailSent ? 'Email notification sent to customer' : 'Email notification failed';
        
        toast({
          title: "Lead Updated Successfully",
          description: `Lead information has been updated. ${emailStatus}`,
        });
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevertToCustomer = async () => {
    if (!id) return;
    
    const reason = prompt("Please provide a reason for reverting this lead to the customer:");
    if (!reason) return;
    
    setIsReverting(true);
    
    try {
      const response = await leadService.revertLeadToCustomer(id, reason);
      
      if (response.success) {
        toast({
          title: "Lead Reverted",
          description: `Lead has been reverted to customer. Email notification: ${response.data.emailSent ? 'Sent' : 'Failed'}`,
        });
        
        // Update local lead state
        setLead(response.data.lead);
      } else {
        throw new Error(response.message || 'Failed to revert lead');
      }
    } catch (error) {
      console.error('Error reverting lead:', error);
      toast({
        title: "Error",
        description: "Failed to revert lead to customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReverting(false);
    }
  };

  const handleSendRemarks = async () => {
    if (!id || !remarks.trim()) {
      toast({
        title: "Error",
        description: "Please enter some remarks before sending.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSendingRemarks(true);
    
    try {
      console.log('🚀 Sending remarks to customer:', { id, remarks: remarks.trim() });
      const response = await leadService.sendRemarksToCustomer(id, remarks.trim());
      console.log('📧 Send remarks response:', response);
      
      if (response.success) {
        toast({
          title: "Remarks Sent",
          description: `Remarks have been sent to customer. Email notification: ${response.data.emailSent ? 'Sent' : 'Failed'}`,
        });
        
        // Clear the remarks after successful send
        setRemarks('');
        
        // Update local lead state if needed
        if (response.data.lead) {
          setLead(response.data.lead);
        }
      } else {
        throw new Error(response.message || 'Failed to send remarks');
      }
    } catch (error: any) {
      console.error('❌ Error sending remarks:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to send remarks to customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingRemarks(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Under Review': return 'bg-orange-100 text-orange-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="boi-card max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Lead Details</h3>
            <p className="text-gray-600">Please wait while we fetch the lead information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lead) {
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 boi-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Details - {lead._id}</h1>
            <p className="text-gray-600">Manage and track lead information</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge className={`${getStatusBadgeColor(lead.status)} px-3 py-1`}>
            {lead.status}
          </Badge>
          
          {user && (role === 'nodal' || role === 'processing') && (
            <>
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
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
                <div className="flex space-x-2">
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Lead
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleRevertToCustomer}
                    disabled={isReverting}
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    {isReverting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Reverting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Revert to Customer
                      </>
                    )}
                  </Button>
                </div>
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
                    value={isEditing ? editForm.customerName : lead.customerName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="customerAge">Age</Label>
                  <Input
                    id="customerAge"
                    value={isEditing ? editForm.customerAge : lead.customerAge}
                    onChange={(e) => setEditForm(prev => ({ ...prev, customerAge: parseInt(e.target.value) }))}
                    disabled={!isEditing}
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="phone"
                      value={isEditing ? editForm.phone : lead.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="email"
                      value={isEditing ? editForm.email : lead.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
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
                    value={isEditing ? editForm.customerOccupation : lead.customerOccupation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, customerOccupation: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="income">Monthly Income</Label>
                  <Input
                    id="income"
                    value={isEditing ? editForm.customerIncome : lead.customerIncome}
                    onChange={(e) => setEditForm(prev => ({ ...prev, customerIncome: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Information */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productType">Product Type</Label>
                  <Select 
                    value={isEditing ? editForm.productType : lead.productType} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, productType: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                      <SelectItem value="Home Loan">Home Loan</SelectItem>
                      <SelectItem value="Car Loan">Car Loan</SelectItem>
                      <SelectItem value="Business Loan">Business Loan</SelectItem>
                      <SelectItem value="Education Loan">Education Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    id="loanAmount"
                    value={isEditing ? editForm.loanAmount : lead.loanAmount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, loanAmount: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={isEditing ? editForm.region : lead.region}
                    onChange={(e) => setEditForm(prev => ({ ...prev, region: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={isEditing ? editForm.status : lead.status} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin/Officer Remarks */}
          {user && (role === 'authority' || role === 'nodal' || role === 'processing') && (
            <Card className="boi-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Send Remarks to Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full"
                  placeholder="Enter remarks or updates for the customer..."
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSendRemarks}
                    disabled={isSendingRemarks || !remarks.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSendingRemarks ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Remarks
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Documents */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.documents && Array.isArray(lead.documents) && lead.documents.length > 0 ? (
                <div className="space-y-2">
                  {lead.documents.map((doc, index) => {
                    // Handle both string URLs and document objects
                    let documentUrl = '';
                    let documentName = '';
                    
                    if (typeof doc === 'string') {
                      documentUrl = doc;
                      documentName = doc.split('/').pop() || 'Document';
                    } else if (doc && typeof doc === 'object') {
                      documentUrl = doc.url || '';
                      documentName = doc.originalName || doc.filename || 'Document';
                    }
                    
                    if (!documentUrl) return null;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">{documentName}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(documentUrl, '_blank')}
                            title="View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = documentUrl;
                              link.download = documentName;
                              link.click();
                            }}
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No documents uploaded</p>
              )}
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
                <span className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium">{new Date(lead.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Days Since Creation:</span>
                <span className="font-medium">
                  {Math.ceil((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24))} days
                </span>
              </div>
              <div className="flex justify-between">
                <span>Priority Score:</span>
                <span className="font-medium">{lead.priorityScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Credit Score:</span>
                <span className="font-medium">{lead.creditScore}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-indigo-600" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Assigned To:</span>
                <span className="font-medium text-sm">
                  {typeof lead.assignedTo === 'object' ? lead.assignedTo.username : lead.assignedTo || 'Unassigned'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Created By:</span>
                <span className="font-medium text-sm">{lead.createdBy.username}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;