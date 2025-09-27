// Bank of India Mock Data for Lead Management System

export interface User {
  id: string;
  name: string;
  role: 'processing' | 'nodal' | 'authority';
  roleTitle: string;
  email: string;
  phone: string;
  region?: string;
}

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  productType: string;
  status: 'New' | 'Document Collection' | 'Initial Review' | 'Credit Assessment' | 'Final Review' | 'Approved' | 'Rejected' | 'Completed';
  priorityScore: number;
  assignedTo: string;
  createdDate: string;
  lastUpdated: string;
  region: string;
  creditScore: number;
  loanAmount: string;
  aiInsight: string;
  documents: string[];
  customerAge: number;
  customerOccupation: string;
  customerIncome: string;
}

export interface AuditLog {
  id: string;
  leadId: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

// Mock Users Data
export const mockUsers: Record<string, User> = {
  processing: {
    id: "PS001",
    name: "Amit Singh",
    role: "processing",
    roleTitle: "Processing Centre Staff",
    email: "amit.singh@bankofindia.co.in",
    phone: "+91-9876543210",
    region: "Mumbai West"
  },
  nodal: {
    id: "NO001", 
    name: "Priya Sharma",
    role: "nodal",
    roleTitle: "Nodal Officer (Zonal)",
    email: "priya.sharma@bankofindia.co.in",
    phone: "+91-9876543211",
    region: "Mumbai Zone"
  },
  authority: {
    id: "HA001",
    name: "Rajesh Gupta", 
    role: "authority",
    roleTitle: "Higher Authority",
    email: "rajesh.gupta@bankofindia.co.in",
    phone: "+91-9876543212",
    region: "Western Region"
  }
};

// Mock Leads Data (50+ realistic entries)
export const mockLeads: Lead[] = [
  {
    id: "LD001",
    customerName: "Rajesh Kumar",
    phone: "+91-9876543210",
    email: "rajesh.kumar@email.com",
    productType: "Home Loan",
    status: "Initial Review",
    priorityScore: 85,
    assignedTo: "Amit Singh",
    createdDate: "2024-01-15",
    lastUpdated: "2024-01-20",
    region: "Mumbai West",
    creditScore: 750,
    loanAmount: "₹50,00,000",
    aiInsight: "High priority - excellent credit score and urgent requirement",
    documents: ["PAN Card", "Salary Slips", "Bank Statements"],
    customerAge: 35,
    customerOccupation: "Software Engineer",
    customerIncome: "₹12,00,000"
  },
  {
    id: "LD002",
    customerName: "Sneha Patel",
    phone: "+91-9876543211",
    email: "sneha.patel@email.com",
    productType: "Car Loan",
    status: "New",
    priorityScore: 92,
    assignedTo: "Priya Sharma",
    createdDate: "2024-01-18",
    lastUpdated: "2024-01-18",
    region: "Ahmedabad",
    creditScore: 780,
    loanAmount: "₹8,50,000",
    aiInsight: "Highest priority - premium customer with excellent history",
    documents: ["Aadhar Card", "Income Certificate"],
    customerAge: 29,
    customerOccupation: "Doctor",
    customerIncome: "₹15,00,000"
  },
  {
    id: "LD003",
    customerName: "Mohammed Ali",
    phone: "+91-9876543212",
    email: "mohammed.ali@email.com",
    productType: "Business Loan",
    status: "Initial Review",
    priorityScore: 78,
    assignedTo: "Rajesh Gupta",
    createdDate: "2024-01-10",
    lastUpdated: "2024-01-19",
    region: "Delhi NCR",
    creditScore: 720,
    loanAmount: "₹25,00,000",
    aiInsight: "Good candidate - established business with growth potential",
    documents: ["Business License", "GST Returns", "ITR"],
    customerAge: 42,
    customerOccupation: "Business Owner",
    customerIncome: "₹8,00,000"
  },
  {
    id: "LD004",
    customerName: "Anita Desai",
    phone: "+91-9876543213",
    email: "anita.desai@email.com",
    productType: "Personal Loan",
    status: "Approved",
    priorityScore: 65,
    assignedTo: "Amit Singh",
    createdDate: "2024-01-05",
    lastUpdated: "2024-01-21",
    region: "Pune",
    creditScore: 680,
    loanAmount: "₹3,00,000",
    aiInsight: "Standard approval - meets all criteria",
    documents: ["PAN Card", "Salary Certificate"],
    customerAge: 31,
    customerOccupation: "Teacher",
    customerIncome: "₹6,00,000"
  },
  {
    id: "LD005",
    customerName: "Suresh Reddy",
    phone: "+91-9876543214",
    email: "suresh.reddy@email.com",
    productType: "Home Loan",
    status: "Rejected",
    priorityScore: 25,
    assignedTo: "Priya Sharma",
    createdDate: "2024-01-12",
    lastUpdated: "2024-01-22",
    region: "Hyderabad",
    creditScore: 550,
    loanAmount: "₹40,00,000",
    aiInsight: "Low priority - credit score below threshold",
    documents: ["PAN Card"],
    customerAge: 45,
    customerOccupation: "Sales Executive",
    customerIncome: "₹4,50,000"
  }
  // Additional leads would continue here...
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: "AL001",
    leadId: "LD001",
    action: "Lead Created",
    user: "Amit Singh",
    timestamp: "2024-01-15T10:30:00Z",
    details: "Initial lead entry completed"
  },
  {
    id: "AL002", 
    leadId: "LD001",
    action: "Status Updated",
    user: "Priya Sharma", 
    timestamp: "2024-01-16T14:20:00Z",
    details: "Status changed from New to In Progress",
    oldValue: "New",
    newValue: "In Progress"
  },
  {
    id: "AL003",
    leadId: "LD001",
    action: "Assignment Changed",
    user: "Rajesh Gupta",
    timestamp: "2024-01-17T09:15:00Z", 
    details: "Lead reassigned to senior officer",
    oldValue: "Amit Singh",
    newValue: "Priya Sharma"
  }
];

// Mock Analytics Data
export const mockAnalytics = {
  totalLeads: 156,
  activeLeads: 89,
  completedLeads: 45,
  conversionRate: 28.8,
  avgProcessingTime: 12.5,
  monthlyTrends: [
    { month: 'Oct', leads: 45, converted: 12 },
    { month: 'Nov', leads: 52, converted: 18 },
    { month: 'Dec', leads: 59, converted: 15 },
    { month: 'Jan', leads: 67, converted: 22 }
  ],
  productDistribution: [
    { product: 'Home Loan', count: 45, percentage: 42 },
    { product: 'Car Loan', count: 28, percentage: 26 },
    { product: 'Personal Loan', count: 21, percentage: 20 },
    { product: 'Business Loan', count: 13, percentage: 12 }
  ],
  regionPerformance: [
    { region: 'Mumbai', leads: 67, conversion: 32 },
    { region: 'Delhi NCR', leads: 45, conversion: 28 },
    { region: 'Bangalore', leads: 38, conversion: 35 },
    { region: 'Chennai', leads: 34, conversion: 26 }
  ]
};