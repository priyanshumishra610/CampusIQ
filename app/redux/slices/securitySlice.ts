import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  triggerEmergency,
  SecurityIncident,
  IncidentStatus,
  IncidentType,
  EmergencyAlert,
} from '../../services/security.service';

type SecurityState = {
  incidents: SecurityIncident[];
  currentIncident: SecurityIncident | null;
  emergencies: EmergencyAlert[];
  loading: boolean;
  error?: string;
  lastFetched?: number;
  summary: {
    active: number;
    resolved: number;
    critical: number;
    total: number;
  } | null;
};

const initialState: SecurityState = {
  incidents: [],
  currentIncident: null,
  emergencies: [],
  loading: false,
  summary: null,
};

export const fetchIncidents = createAsyncThunk(
  'security/fetchIncidents',
  async (
    {status, type, startDate, endDate}: {
      status?: IncidentStatus;
      type?: IncidentType;
      startDate?: number;
      endDate?: number;
    },
    {rejectWithValue},
  ) => {
    try {
      return await getIncidents({status, type, startDate, endDate});
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch incidents');
    }
  },
);

export const fetchIncidentById = createAsyncThunk(
  'security/fetchIncidentById',
  async (incidentId: string, {rejectWithValue}) => {
    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }
      return incident;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch incident');
    }
  },
);

export const createNewIncident = createAsyncThunk(
  'security/createIncident',
  async (
    {
      type,
      description,
      location,
      severity,
      reportedBy,
      reportedByName,
    }: {
      type: IncidentType;
      description: string;
      location?: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      reportedBy: string;
      reportedByName: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const incidentId = await createIncident({
        type,
        description,
        location,
        severity,
        reportedBy,
        reportedByName,
      });
      return incidentId;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create incident');
    }
  },
);

export const updateIncident = createAsyncThunk(
  'security/updateIncident',
  async (
    {
      incidentId,
      status,
      resolution,
      resolvedBy,
    }: {
      incidentId: string;
      status?: IncidentStatus;
      resolution?: string;
      resolvedBy?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      if (status) {
        await updateIncidentStatus(incidentId, status, resolution, resolvedBy);
      }
      const incident = await getIncidentById(incidentId);
      return incident;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update incident');
    }
  },
);

export const triggerEmergencyAlert = createAsyncThunk(
  'security/triggerEmergency',
  async (
    {
      type,
      location,
      description,
      triggeredBy,
      triggeredByName,
    }: {
      type: 'SOS' | 'FIRE' | 'MEDICAL' | 'SECURITY_BREACH' | 'NATURAL_DISASTER';
      location: string;
      description: string;
      triggeredBy: string;
      triggeredByName: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const alertId = await triggerEmergency({
        type,
        location,
        description,
        triggeredBy,
        triggeredByName,
      });
      return alertId;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to trigger emergency');
    }
  },
);

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    setCurrentIncident: (state, action: PayloadAction<SecurityIncident | null>) => {
      state.currentIncident = action.payload;
    },
    clearIncidents: state => {
      state.incidents = [];
      state.currentIncident = null;
      state.error = undefined;
      state.summary = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchIncidents.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.incidents = action.payload;
        state.lastFetched = Date.now();
        
        // Calculate summary
        const incidents = action.payload;
        state.summary = {
          active: incidents.filter(i => i.status === 'ACTIVE').length,
          resolved: incidents.filter(i => i.status === 'RESOLVED').length,
          critical: incidents.filter(i => i.severity === 'CRITICAL').length,
          total: incidents.length,
        };
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchIncidentById.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchIncidentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentIncident = action.payload;
      })
      .addCase(fetchIncidentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createNewIncident.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(createNewIncident.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createNewIncident.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateIncident.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(updateIncident.fulfilled, (state, action) => {
        state.loading = false;
        state.currentIncident = action.payload;
        // Update in list if exists
        const index = state.incidents.findIndex(i => i.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.incidents[index] = action.payload;
        }
      })
      .addCase(updateIncident.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(triggerEmergencyAlert.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(triggerEmergencyAlert.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(triggerEmergencyAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {setCurrentIncident, clearIncidents} = securitySlice.actions;
export default securitySlice.reducer;

