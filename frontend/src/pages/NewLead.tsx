import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useOfflineLeadSync } from '@/hooks/useOfflineLeadSync';
import { useRole } from '@/contexts/RoleContext';
import { leadService, type CreateLeadRequest } from '@/services/leadService';
import { uploadService, type CreateLeadWithFilesRequest } from '@/services/uploadService';
import FileUpload from '@/components/ui/FileUpload';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign, 
  FileText,
  Save,
  ArrowLeft,
  Sparkles,
  Loader2,
  Upload
} from 'lucide-react';

interface LeadFormData {
  customerName: string;
  phone: string;
  email: string;
  productType: string;
  loanAmount: string;
  customerAge: string;
  customerOccupation: string;
  customerIncome: string;
  region: string;
  notes: string;
  creditScore: string; // Added credit score field
}

const NewLead: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, currentRole } = useRole();
  const { enqueue, manualSync, stats, isOnline } = useOfflineLeadSync({ role: currentRole, apiUrl: '/leads/sync' });
  
  const [formData, setFormData] = useState<LeadFormData>({
    customerName: '',
    phone: '',
    email: '',
    productType: '',
    loanAmount: '',
    customerAge: '',
    customerOccupation: '',
    customerIncome: '',
    region: currentUser.region || '',
    notes: '',
    creditScore: ''  // Added with empty initial value
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Mock AI scoring based on form data
  const calculateAiScore = () => {
    if (!formData.customerIncome || !formData.customerAge || !formData.loanAmount) {
      return null;
    }

    const income = parseInt(formData.customerIncome.replace(/[^\d]/g, ''));
    const age = parseInt(formData.customerAge);
    const loanAmount = parseInt(formData.loanAmount.replace(/[^\d]/g, ''));

    let score = 50; // Base score

    // Income factor
    if (income > 1000000) score += 20;
    else if (income > 500000) score += 10;

    // Age factor
    if (age >= 25 && age <= 45) score += 15;
    else if (age >= 45 && age <= 60) score += 10;

    // Loan to income ratio
    const loanToIncomeRatio = loanAmount / income;
    if (loanToIncomeRatio < 3) score += 15;
    else if (loanToIncomeRatio < 5) score += 5;

    // Professional occupation bonus
    const professionalOccupations = ['doctor', 'engineer', 'software', 'manager', 'teacher'];
    if (professionalOccupations.some(prof => 
      formData.customerOccupation.toLowerCase().includes(prof)
    )) {
      score += 10;
    }

    return Math.min(Math.max(score, 10), 100);
  };

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Recalculate AI score when relevant fields change
    if (['customerIncome', 'customerAge', 'loanAmount', 'customerOccupation'].includes(field)) {
      setTimeout(() => {
        const newScore = calculateAiScore();
        setAiScore(newScore);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Offline branch
    if (!isOnline) {
      if (currentRole !== 'processing') {
        toast.error('Only Processing role can save offline');
        return;
      }
      if (!formData.customerName || !formData.email || !formData.phone || !formData.productType) {
        toast.error('Fill required fields before offline save');
        return;
      }
      // Prepare data the same way as in online submission
      // Parse values
      const parsedIncome = parseFloat(formData.customerIncome.replace(/[^\d.]/g, '')) || 0;
      const parsedAge = parseInt(formData.customerAge) || 0;
      
      // Use provided credit score if available, otherwise calculate it
      const creditScore = formData.creditScore 
        ? Math.min(Math.max(parseInt(formData.creditScore), 300), 850) 
        : Math.min(Math.max(
            300 + Math.floor(parsedIncome / 10000) +
            (parsedAge >= 25 && parsedAge <= 55 ? 50 : 0) +
            Math.floor(Math.random() * 100), 300), 850);
        
      // Calculate salary from income string - must be a valid number
      const salary = parsedIncome;
      
      // Create lead data object exactly like the online submission
      const leadData = {
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email,
        productType: formData.productType,
        loanAmount: formData.loanAmount,
        customerAge: parsedAge,
        customerOccupation: formData.customerOccupation || '',
        customerIncome: formData.customerIncome,
        salary: salary,
        creditScore: creditScore,
        region: formData.region || currentUser?.region || '',
        status: 'New',
        savedOfflineAt: new Date().toISOString() // Add this field for offline tracking
      };
      
      // Log the values for debug purposes
      console.log('Saving offline lead with:', { creditScore, salary, parsedAge });
      
      // Pass the exact same structure as used for online creation
      enqueue(leadData);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!formData.customerName || !formData.email || !formData.phone || !formData.productType || !formData.customerIncome || !formData.customerAge || !formData.customerOccupation) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Build payload - use provided credit score if available, or calculate it
      const creditScore = formData.creditScore 
        ? Math.min(Math.max(parseInt(formData.creditScore), 300), 850)  // Use input value but ensure it's in valid range
        : Math.min(Math.max(
            300 + Math.floor((parseFloat(formData.customerIncome.replace(/[^\d.]/g, '')) || 0) / 10000) +
            (parseInt(formData.customerAge) >= 25 && parseInt(formData.customerAge) <= 55 ? 50 : 0) +
            Math.floor(Math.random() * 100), 300), 850);

      const leadData = {
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email,
        productType: formData.productType,
        loanAmount: formData.loanAmount,
        customerAge: parseInt(formData.customerAge) || 0,
        customerOccupation: formData.customerOccupation || '',
        customerIncome: formData.customerIncome,
        salary: parseFloat(formData.customerIncome.replace(/[^\d.]/g, '')) || 0,
        creditScore,
        region: formData.region || currentUser?.region || '',
        status: 'New'
      };

      // For brevity, assume simple POST (files handling can be re-added if needed offline logic separated)
      const res = await fetch('http://localhost:5000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const json = await res.json();
      toast.success(`Lead created (ID ${json?.lead?._id || json?.lead?.id || 'N/A'})`);
      navigate('/leads');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lead';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">High Priority</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
    return <Badge variant="secondary">Low Priority</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Lead Entry</h1>
            <p className="text-gray-600">Create a new customer lead for processing</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{isOnline ? 'Online' : 'Offline Mode'}</div>
          {currentRole === 'processing' && (
            <Button type="button" variant={stats.pending ? 'default' : 'outline'} size="sm" onClick={manualSync} disabled={!isOnline || !stats.pending || stats.processing}>
              {stats.processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {stats.pending ? `Sync ${stats.pending}` : 'No Pending'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Enter customer's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerAge">Age</Label>
                    <Input
                      id="customerAge"
                      type="number"
                      value={formData.customerAge}
                      onChange={(e) => handleInputChange('customerAge', e.target.value)}
                      placeholder="Customer age"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91-XXXXXXXXXX"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="customer@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerOccupation">Occupation</Label>
                    <Input
                      id="customerOccupation"
                      value={formData.customerOccupation}
                      onChange={(e) => handleInputChange('customerOccupation', e.target.value)}
                      placeholder="Customer's occupation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerIncome">Annual Income</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="customerIncome"
                        value={formData.customerIncome}
                        onChange={(e) => handleInputChange('customerIncome', e.target.value)}
                        placeholder="₹10,00,000"
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
                    <Label htmlFor="productType">Product Type *</Label>
                    <Select value={formData.productType} onValueChange={(value) => handleInputChange('productType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan type" />
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
                    <Label htmlFor="loanAmount">Loan Amount *</Label>
                    <Input
                      id="loanAmount"
                      value={formData.loanAmount}
                      onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                      placeholder="₹50,00,000"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creditScore">Credit Score</Label>
                    <Input
                      id="creditScore"
                      type="number"
                      min="300"
                      max="850"
                      value={formData.creditScore}
                      onChange={(e) => handleInputChange('creditScore', e.target.value)}
                      placeholder="650"
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 300-850</p>
                  </div>
                  <div></div>
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mumbai West">Mumbai West</SelectItem>
                      <SelectItem value="Mumbai East">Mumbai East</SelectItem>
                      <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                      <SelectItem value="Chennai">Chennai</SelectItem>
                      <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                      <SelectItem value="Pune">Pune</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information about the customer or application..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <FileUpload
              onFilesChange={setSelectedFiles}
              maxFiles={10}
              maxSizePerFile={10}
              className="mb-6"
            />

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isOnline ? 'Create Lead' : 'Save Offline'}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/leads')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* AI Score Panel */}
        <div className="space-y-6">
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                AI Priority Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiScore ? (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{aiScore}</div>
                    <div className="text-sm text-gray-600 mb-4">Priority Score</div>
                    {getScoreBadge(aiScore)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Income Level:</span>
                      <span className="font-medium">
                        {parseInt(formData.customerIncome.replace(/[^\d]/g, '')) > 1000000 ? 'High' : 
                         parseInt(formData.customerIncome.replace(/[^\d]/g, '')) > 500000 ? 'Good' : 'Standard'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Age Group:</span>
                      <span className="font-medium">
                        {parseInt(formData.customerAge) >= 25 && parseInt(formData.customerAge) <= 45 ? 'Prime' : 'Standard'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Occupation:</span>
                      <span className="font-medium">
                        {['doctor', 'engineer', 'software', 'manager'].some(prof => 
                          formData.customerOccupation.toLowerCase().includes(prof)) ? 'Professional' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Fill in customer details to see AI priority assessment</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Processing Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Processing Officer:</span>
                <span className="font-medium">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Region:</span>
                <span className="font-medium">{currentUser.region}</span>
              </div>
              <div className="flex justify-between">
                <span>Created Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Initial Status:</span>
                <Badge variant="outline" className="text-xs">New</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewLead;