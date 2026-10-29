export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'citizen' | 'responder' | 'admin';
  phone?: string;
  address?: string;
  availability?: string;
  skills?: string[];
  areaOfOperation?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface StatusHistoryItem {
  status: string;
  changedBy?: string;
  changedByName: string;
  comment: string;
  timestamp: string;
}

export interface IncidentLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface Incident {
  _id: string;
  title: string;
  description: string;
  category: 'Flood' | 'Landslide' | 'Fire' | 'Heavy rainfall' | 'Medical emergency' | 'Accident' | 'Other emergency';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Reported' | 'Acknowledged' | 'Responder Assigned' | 'Rescue in Progress' | 'Resolved';
  location: IncidentLocation;
  reportedBy: User | string;
  reporterName: string;
  contactPhone: string;
  assignedResponder?: User | null;
  assignedResponderName?: string;
  statusHistory: StatusHistoryItem[];
  isDemoData?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shelter {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number;
  availableSpaces?: number;
  facilities: string[];
  contactPerson: string;
  contactPhone: string;
  status: 'Open' | 'Full' | 'Closed';
  isDemoData?: boolean;
}

export interface Volunteer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  availability: 'Available' | 'On Duty' | 'Busy' | 'Unavailable';
  areaOfOperation: string;
  assignedIncident?: Incident | null;
  assignedIncidentTitle?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  isDemoData?: boolean;
  createdAt: string;
}

export interface Donation {
  _id: string;
  donorName: string;
  isAnonymous: boolean;
  donorEmail?: string;
  donorPhone?: string;
  donationType: 'Monetary' | 'Material / Relief Supplies' | 'Food & Ration' | 'Medical Kits' | 'Clothing';
  amount?: number;
  itemsDescription?: string;
  purpose: string;
  donationDate: string;
  status: 'Pledged' | 'Received' | 'Distributed';
  administrativeNotes?: string;
  isDemoData?: boolean;
}

export interface NotificationItem {
  _id: string;
  recipient?: string;
  targetRole: string;
  title: string;
  message: string;
  type: string;
  incidentId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalIncidents: number;
  activeEmergencies: number;
  awaitingAcknowledgment: number;
  resolvedIncidents: number;
  respondersCount: number;
  activeVolunteers: number;
  totalSheltersCount: number;
  totalShelterCapacity: number;
  totalShelterOccupancy: number;
  availableShelterSpaces: number;
  totalDonationAmount: number;
  totalSuppliesCount: number;
  statusDistribution: { _id: string; count: number }[];
  categoryDistribution: { _id: string; count: number }[];
  severityDistribution: { _id: string; count: number }[];
  recentIncidents: Incident[];
}
