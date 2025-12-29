import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../../services/ticket.service';

type TicketState = {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  loading: boolean;
  error?: string;
  lastFetched?: number;
  summary: {
    open: number;
    inProgress: number;
    resolved: number;
    escalated: number;
    total: number;
  } | null;
};

const initialState: TicketState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  summary: null,
};

export const fetchTickets = createAsyncThunk(
  'ticket/fetchAll',
  async (
    {userId, role, status, category}: {
      userId?: string;
      role?: string;
      status?: TicketStatus;
      category?: TicketCategory;
    },
    {rejectWithValue},
  ) => {
    try {
      return await getTickets({userId, role, status, category});
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch tickets');
    }
  },
);

export const fetchTicketById = createAsyncThunk(
  'ticket/fetchById',
  async (ticketId: string, {rejectWithValue}) => {
    try {
      const ticket = await getTicketById(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch ticket');
    }
  },
);

export const createNewTicket = createAsyncThunk(
  'ticket/create',
  async (
    {
      title,
      description,
      category,
      priority,
      createdBy,
      createdByName,
    }: {
      title: string;
      description: string;
      category: TicketCategory;
      priority: TicketPriority;
      createdBy: string;
      createdByName: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const ticketId = await createTicket({
        title,
        description,
        category,
        priority,
        createdBy,
        createdByName,
      });
      return ticketId;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create ticket');
    }
  },
);

export const updateTicket = createAsyncThunk(
  'ticket/update',
  async (
    {
      ticketId,
      status,
      assignedTo,
      assignedToName,
      comment,
    }: {
      ticketId: string;
      status?: TicketStatus;
      assignedTo?: string;
      assignedToName?: string;
      comment?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      if (status) {
        await updateTicketStatus(ticketId, status, comment);
      }
      if (assignedTo) {
        await assignTicket(ticketId, assignedTo, assignedToName || '');
      }
      const ticket = await getTicketById(ticketId);
      return ticket;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update ticket');
    }
  },
);

const ticketSlice = createSlice({
  name: 'ticket',
  initialState,
  reducers: {
    setCurrentTicket: (state, action: PayloadAction<Ticket | null>) => {
      state.currentTicket = action.payload;
    },
    clearTickets: state => {
      state.tickets = [];
      state.currentTicket = null;
      state.error = undefined;
      state.summary = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTickets.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
        state.lastFetched = Date.now();
        
        // Calculate summary
        const tickets = action.payload;
        state.summary = {
          open: tickets.filter(t => t.status === 'OPEN').length,
          inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
          resolved: tickets.filter(t => t.status === 'RESOLVED').length,
          escalated: tickets.filter(t => t.status === 'ESCALATED').length,
          total: tickets.length,
        };
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTicketById.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createNewTicket.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(createNewTicket.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createNewTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTicket.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
        // Update in list if exists
        const index = state.tickets.findIndex(t => t.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {setCurrentTicket, clearTickets} = ticketSlice.actions;
export default ticketSlice.reducer;

