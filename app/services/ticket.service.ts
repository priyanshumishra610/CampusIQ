import apiClient from './api.client';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory =
  | 'ACADEMIC'
  | 'TECHNICAL'
  | 'FACILITY'
  | 'HOSTEL'
  | 'MESS'
  | 'PAYMENT'
  | 'OTHER';

export type Ticket = {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  comments?: {
    id: string;
    text: string;
    createdBy: string;
    createdByName: string;
    createdAt: number;
  }[];
  slaDeadline?: number; // timestamp
  resolvedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export const createTicket = async (
  ticket: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'comments'>,
): Promise<string> => {
  try {
    const response = await apiClient.post('/tickets', {
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
    });
    return response.id;
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create ticket');
  }
};

export const getTickets = async (filters: {
  userId?: string;
  role?: string;
  status?: TicketStatus;
  category?: TicketCategory;
}): Promise<Ticket[]> => {
  try {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.userId && filters.role === 'SUPPORT') {
      params.assignedTo = filters.userId;
    }

    const data = await apiClient.get('/tickets', params);
    
    return data.map((ticket: any) => ({
      ...ticket,
      createdAt: ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now(),
      updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt).getTime() : Date.now(),
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : undefined,
      comments: ticket.comments || [],
    }));
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch tickets');
  }
};

export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  try {
    const data = await apiClient.get(`/tickets/${ticketId}`);
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt).getTime() : undefined,
      comments: data.comments || [],
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('Error fetching ticket:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch ticket');
  }
};

export const updateTicketStatus = async (
  ticketId: string,
  status: TicketStatus,
  comment?: string,
): Promise<void> => {
  try {
    const updates: any = {status};
    if (comment) {
      // Note: Backend doesn't have comment endpoint yet
      // This would need to be added
      console.warn('Ticket comments not yet implemented in backend');
    }
    await apiClient.put(`/tickets/${ticketId}`, updates);
  } catch (error: any) {
    console.error('Error updating ticket status:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update ticket status');
  }
};

export const assignTicket = async (
  ticketId: string,
  assignedTo: string,
  assignedToName: string,
): Promise<void> => {
  try {
    await apiClient.put(`/tickets/${ticketId}`, {
      assignedTo,
    });
  } catch (error: any) {
    console.error('Error assigning ticket:', error);
    throw new Error(error?.response?.data?.error || 'Failed to assign ticket');
  }
};

export const addTicketComment = async (
  ticketId: string,
  comment: {
    text: string;
    createdBy: string;
    createdByName: string;
  },
): Promise<void> => {
  try {
    // Note: Backend doesn't have comment endpoint yet
    // This would need to be added
    console.warn('Ticket comments not yet implemented in backend');
  } catch (error: any) {
    console.error('Error adding comment:', error);
    throw new Error(error?.response?.data?.error || 'Failed to add comment');
  }
};
