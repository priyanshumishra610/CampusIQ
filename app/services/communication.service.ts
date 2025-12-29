import apiClient from './api.client';

export type EventType = 'ACADEMIC' | 'CULTURAL' | 'SPORTS' | 'WORKSHOP' | 'SEMINAR' | 'OTHER';
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export type Event = {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: number;
  endDate: number;
  location: string;
  venue?: string;
  organizerId: string;
  organizerName: string;
  campusId?: string;
  departmentId?: string;
  maxParticipants?: number;
  registeredParticipants: string[];
  imageUrl?: string;
  registrationRequired: boolean;
  registrationDeadline?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
};

export type ClubType = 'ACADEMIC' | 'CULTURAL' | 'SPORTS' | 'TECHNICAL' | 'SOCIAL' | 'OTHER';

export type Club = {
  id: string;
  name: string;
  description: string;
  type: ClubType;
  presidentId: string;
  presidentName: string;
  facultyAdvisorId?: string;
  facultyAdvisorName?: string;
  campusId?: string;
  departmentId?: string;
  memberCount: number;
  members: string[];
  imageUrl?: string;
  socialLinks?: {
    website?: string;
    instagram?: string;
    facebook?: string;
  };
  meetingSchedule?: string;
  createdAt: number;
  updatedAt: number;
};

// Create event
export const createEvent = async (
  event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registeredParticipants' | 'status'>,
): Promise<string> => {
  try {
    const response = await apiClient.post('/events', {
      ...event,
      startDate: new Date(event.startDate).toISOString(),
      endDate: event.endDate ? new Date(event.endDate).toISOString() : null,
      category: event.type,
    });
    return response.id;
  } catch (error: any) {
    console.error('Error creating event:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create event');
  }
};

// Get events
export const getEvents = async (
  filters?: {
    campusId?: string;
    departmentId?: string;
    type?: EventType;
    status?: EventStatus;
    startDate?: number;
    endDate?: number;
  },
): Promise<Event[]> => {
  try {
    const params: any = {};
    if (filters?.startDate) params.startDate = new Date(filters.startDate).toISOString();
    if (filters?.endDate) params.endDate = new Date(filters.endDate).toISOString();

    const data = await apiClient.get('/events', params);
    
    return data.map((event: any) => ({
      ...event,
      type: event.category || 'OTHER',
      startDate: event.startDate ? new Date(event.startDate).getTime() : Date.now(),
      endDate: event.endDate ? new Date(event.endDate).getTime() : Date.now(),
      createdAt: event.createdAt ? new Date(event.createdAt).getTime() : Date.now(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt).getTime() : Date.now(),
      registeredParticipants: [], // Backend doesn't track this yet
    }));
  } catch (error: any) {
    console.error('Error fetching events:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch events');
  }
};

// Register for event
export const registerForEvent = async (
  eventId: string,
  userId: string,
): Promise<void> => {
  try {
    // Note: Backend doesn't have event registration endpoint yet
    // This would need to be added to the backend
    console.warn('Event registration not yet implemented in backend');
  } catch (error: any) {
    console.error('Error registering for event:', error);
    throw new Error(error?.response?.data?.error || 'Failed to register for event');
  }
};

// Create club
export const createClub = async (
  club: Omit<Club, 'id' | 'createdAt' | 'updatedAt' | 'memberCount' | 'members'>,
): Promise<string> => {
  try {
    // Note: Backend doesn't have clubs endpoint yet
    // This would need to be added to the backend
    throw new Error('Club creation not yet implemented in backend');
  } catch (error: any) {
    console.error('Error creating club:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create club');
  }
};

// Get clubs
export const getClubs = async (
  filters?: {
    campusId?: string;
    departmentId?: string;
    type?: ClubType;
  },
): Promise<Club[]> => {
  try {
    // Note: Backend doesn't have clubs endpoint yet
    // Return empty array for now
    return [];
  } catch (error: any) {
    console.error('Error fetching clubs:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch clubs');
  }
};

// Join club
export const joinClub = async (clubId: string, userId: string): Promise<void> => {
  try {
    // Note: Backend doesn't have clubs endpoint yet
    throw new Error('Club joining not yet implemented in backend');
  } catch (error: any) {
    console.error('Error joining club:', error);
    throw new Error(error?.response?.data?.error || 'Failed to join club');
  }
};

// Leave club
export const leaveClub = async (clubId: string, userId: string): Promise<void> => {
  try {
    // Note: Backend doesn't have clubs endpoint yet
    throw new Error('Leaving club not yet implemented in backend');
  } catch (error: any) {
    console.error('Error leaving club:', error);
    throw new Error(error?.response?.data?.error || 'Failed to leave club');
  }
};

// Create announcement
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementAudience = 'ALL' | 'COURSE' | 'DEPARTMENT';

export const createAnnouncement = async (announcement: {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetRoles?: string[];
  targetCourses?: string[];
  createdBy: string;
  createdByName: string;
  campusId: string;
}): Promise<string> => {
  try {
    const response = await apiClient.post('/announcements', {
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetRoles: announcement.targetRoles || [],
      targetCourses: announcement.targetCourses || [],
    });
    return response.id;
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create announcement');
  }
};

// Get announcements
export const getAnnouncements = async (filters?: {
  role?: string;
  courseId?: string;
}): Promise<any[]> => {
  try {
    const params: any = {};
    if (filters?.role) params.role = filters.role;
    
    const data = await apiClient.get('/announcements', params);
    return data.map((announcement: any) => ({
      ...announcement,
      createdAt: announcement.createdAt ? new Date(announcement.createdAt).getTime() : Date.now(),
      updatedAt: announcement.updatedAt ? new Date(announcement.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch announcements');
  }
};
