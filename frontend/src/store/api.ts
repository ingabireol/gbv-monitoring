import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

const baseQuery = fetchBaseQuery({
  baseUrl: `${(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8083/api').replace(/\/$/, '')}/`,
  prepareHeaders: (headers, { getState, endpoint }) => {
    const publicEndpoints = new Set([
      'createAnonymousReport',
      'getAnonymousReportStatus',
      'updateAnonymousContactDetails',
      'getAnonymousChat',
      'sendAnonymousChatMessage',
      'login',
      'register',
    ]);
    if (publicEndpoints.has(endpoint)) {
      headers.delete('Authorization');
      return headers;
    }

    const token = (getState() as RootState).auth.token ?? localStorage.getItem('gbv_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  endpoints: (builder) => ({
    getCases: builder.query<any, { page?: number; size?: number; status?: string; type?: string }>({
      query: ({ page = 0, size = 10, status, type }) => {
        let params = `cases?page=${page}&size=${size}`;
        if (status) params += `&status=${status}`;
        if (type) params += `&type=${type}`;
        return params;
      },
    }),
    getMyCases: builder.query<any, void>({
      query: () => 'cases/mine',
    }),
    getAssignedCases: builder.query<any, void>({
      query: () => 'cases/assigned/me',
    }),
    assignOfficer: builder.mutation<any, { id: string; officerId: string }>({
      query: ({ id, officerId }) => ({
        url: `cases/${id}/assign`,
        method: 'PUT',
        body: { officerId },
      }),
    }),
    updateCaseStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `cases/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
    }),
    updateVictimCaseDetails: builder.mutation<any, { id: string; victimAddress?: string }>({
      query: ({ id, ...body }) => ({
        url: `cases/${id}/victim-details`,
        method: 'PUT',
        body,
      }),
    }),
    withdrawVictimCase: builder.mutation<any, string>({
      query: (id) => ({
        url: `cases/${id}/withdraw`,
        method: 'PUT',
      }),
    }),
    deleteCase: builder.mutation<any, string>({
      query: (id) => ({
        url: `cases/${id}`,
        method: 'DELETE',
      }),
    }),

    createReport: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: 'reports',
        method: 'POST',
        body: formData,
      }),
    }),
    createAnonymousReport: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: 'reports/anonymous',
        method: 'POST',
        body: formData,
      }),
    }),
    getAnonymousReportStatus: builder.query<any, string>({
      query: (reference) => `anonymous/${encodeURIComponent(reference)}`,
    }),
    updateAnonymousContactDetails: builder.mutation<any, { reference: string; body: any }>({
      query: ({ reference, body }) => ({
        url: `anonymous/${encodeURIComponent(reference)}/contact-details`,
        method: 'PUT',
        body,
      }),
    }),
    getAnonymousChat: builder.query<any, string>({
      query: (reference) => `anonymous/${encodeURIComponent(reference)}/chat`,
    }),
    sendAnonymousChatMessage: builder.mutation<any, { reference: string; fieldKey?: string; message: string }>({
      query: ({ reference, fieldKey, message }) => ({
        url: `anonymous/${encodeURIComponent(reference)}/chat`,
        method: 'POST',
        body: { fieldKey, message },
      }),
    }),
    getReport: builder.query<any, string>({
      query: (id) => `reports/${id}`,
    }),

    getReferrals: builder.query<any, { caseId: string; page?: number; size?: number }>({
      query: ({ caseId, page = 0, size = 10 }) => `referrals/case/${caseId}?page=${page}&size=${size}`,
    }),
    getAllReferrals: builder.query<any, { referredTo?: string; status?: string; page?: number; size?: number }>({
      query: ({ referredTo, status, page = 0, size = 100 }) => {
        const params = new URLSearchParams({
          page: String(page),
          size: String(size),
        });
        if (referredTo) params.set('referredTo', referredTo);
        if (status) params.set('status', status);
        return `referrals?${params.toString()}`;
      },
    }),
    createReferral: builder.mutation<any, {
      caseId: string;
      referredTo: string;
      referredBy?: string;
      referredByRole?: string;
      institutionType?: string;
      reason?: string;
      urgency?: string;
    }>({
      query: (body) => ({
        url: 'referrals',
        method: 'POST',
        body,
      }),
    }),
    updateReferral: builder.mutation<any, {
      id: string;
      caseId?: string;
      referredTo?: string;
      institutionType?: string;
      reason?: string;
      urgency?: string;
    }>({
      query: ({ id, ...body }) => ({
        url: `referrals/${id}`,
        method: 'PUT',
        body,
      }),
    }),
    updateReferralStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `referrals/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
    }),

    getNotifications: builder.query<any, string>({
      query: (userId) => `notifications/user/${userId}`,
    }),
    markNotificationRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'PUT',
      }),
    }),
    createNotification: builder.mutation<any, { userId: string; type: string; message: string }>({
      query: (body) => ({
        url: 'notifications',
        method: 'POST',
        body,
      }),
    }),

    getUsers: builder.query<any, { role?: string; enabled?: boolean | string } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params && typeof params === 'object') {
          if (params.role) search.set('role', String(params.role));
          if (params.enabled !== undefined && params.enabled !== '') {
            search.set('enabled', String(params.enabled));
          }
        }
        const suffix = search.toString();
        return suffix ? `users?${suffix}` : 'users';
      },
    }),
    createUser: builder.mutation<any, any>({
      query: (body) => ({
        url: 'users',
        method: 'POST',
        body,
      }),
    }),
    getCurrentProfile: builder.query<any, void>({
      query: () => 'users/me',
    }),
    updateCurrentProfile: builder.mutation<any, any>({
      query: (body) => ({
        url: 'users/me',
        method: 'PUT',
        body,
      }),
    }),
    updateUserStatus: builder.mutation<any, { id: string; enabled: boolean }>({
      query: ({ id, enabled }) => ({
        url: `users/${id}/status`,
        method: 'PUT',
        body: { enabled },
      }),
    }),
    updateUser: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `users/${id}`,
        method: 'PUT',
        body,
      }),
    }),
    deleteUser: builder.mutation<any, string>({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE',
      }),
    }),

    getAuditLogs: builder.query<any, void>({
      query: () => 'audit-logs',
    }),
    getUserAuditLogs: builder.query<any, string>({
      query: (userId) => `audit-logs/user/${userId}`,
    }),

    getCasesByDistrictAnalytics: builder.query<any, void>({
      query: () => 'analytics/cases-by-district',
    }),
    getTrendsAnalytics: builder.query<any, void>({
      query: () => 'analytics/trends',
    }),
    getResolutionRateAnalytics: builder.query<any, void>({
      query: () => 'analytics/resolution-rate',
    }),

    getMilestones: builder.query<any, string>({
      query: (caseId) => `milestones/case/${caseId}`,
    }),
    addMilestone: builder.mutation<any, { caseId: string; name: string }>({
      query: (body) => ({
        url: 'milestones',
        method: 'POST',
        body,
      }),
    }),
    updateMilestone: builder.mutation<any, { id: string; name?: string; completed?: boolean }>({
      query: ({ id, ...body }) => ({
        url: `milestones/${id}`,
        method: 'PUT',
        body,
      }),
    }),
    completeMilestone: builder.mutation<any, string>({
      query: (id) => ({
        url: `milestones/${id}/complete`,
        method: 'PUT',
      }),
    }),
    deleteMilestone: builder.mutation<any, string>({
      query: (id) => ({
        url: `milestones/${id}`,
        method: 'DELETE',
      }),
    }),
    getTimelineEvents: builder.query<any, string>({
      query: (caseId) => `timeline-events/case/${caseId}`,
    }),
    getAssignedTimelineEvents: builder.query<any, void>({
      query: () => 'timeline-events/assigned/me',
    }),
    logTimelineEvent: builder.mutation<any, { caseId: string; eventType: string; description: string }>({
      query: (body) => ({
        url: 'timeline-events',
        method: 'POST',
        body,
      }),
    }),

    getTemplateNotifications: builder.query<any, void>({
      query: () => 'template-notifications',
    }),
    createTemplateNotification: builder.mutation<any, any>({
      query: (body) => ({
        url: 'template-notifications',
        method: 'POST',
        body,
      }),
    }),
    updateTemplateNotification: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `template-notifications/${id}`,
        method: 'PUT',
        body,
      }),
    }),
    deleteTemplateNotification: builder.mutation<any, string>({
      query: (id) => ({
        url: `template-notifications/${id}`,
        method: 'DELETE',
      }),
    }),
    sendTemplateNotificationTest: builder.mutation<any, string>({
      query: (id) => ({
        url: `template-notifications/${id}/test-send`,
        method: 'POST',
      }),
    }),

    login: builder.mutation<any, { username: string; password: string }>({
      query: (body) => ({
        url: 'auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation<any, { username: string; password: string }>({
      query: (body) => ({
        url: 'auth/register',
        method: 'POST',
        body,
      }),
    }),

    // Officer-side: anonymous reporter chat for an assigned case
    getAnonymousCaseChat: builder.query<any, string>({
      query: (caseId) => `cases/${caseId}/anonymous-chat`,
    }),
    sendAnonymousCaseChatReply: builder.mutation<any, { caseId: string; message: string }>({
      query: ({ caseId, message }) => ({
        url: `cases/${caseId}/anonymous-chat`,
        method: 'POST',
        body: { message },
      }),
    }),
  }),
});

export const {
  useGetCasesQuery,
  useGetMyCasesQuery,
  useGetAssignedCasesQuery,
  useAssignOfficerMutation,
  useUpdateCaseStatusMutation,
  useUpdateVictimCaseDetailsMutation,
  useWithdrawVictimCaseMutation,
  useDeleteCaseMutation,
  useCreateReportMutation,
  useCreateAnonymousReportMutation,
  useGetAnonymousReportStatusQuery,
  useLazyGetAnonymousReportStatusQuery,
  useUpdateAnonymousContactDetailsMutation,
  useGetAnonymousChatQuery,
  useLazyGetAnonymousChatQuery,
  useSendAnonymousChatMessageMutation,
  useGetReportQuery,
  useGetReferralsQuery,
  useGetAllReferralsQuery,
  useCreateReferralMutation,
  useUpdateReferralMutation,
  useUpdateReferralStatusMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useCreateNotificationMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetCurrentProfileQuery,
  useUpdateCurrentProfileMutation,
  useUpdateUserStatusMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetAuditLogsQuery,
  useGetUserAuditLogsQuery,
  useGetCasesByDistrictAnalyticsQuery,
  useGetTrendsAnalyticsQuery,
  useGetResolutionRateAnalyticsQuery,
  useGetMilestonesQuery,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useCompleteMilestoneMutation,
  useDeleteMilestoneMutation,
  useGetTimelineEventsQuery,
  useGetAssignedTimelineEventsQuery,
  useLogTimelineEventMutation,
  useGetTemplateNotificationsQuery,
  useCreateTemplateNotificationMutation,
  useUpdateTemplateNotificationMutation,
  useDeleteTemplateNotificationMutation,
  useSendTemplateNotificationTestMutation,
  useLoginMutation,
  useRegisterMutation,
  useGetAnonymousCaseChatQuery,
  useLazyGetAnonymousCaseChatQuery,
  useSendAnonymousCaseChatReplyMutation,
} = api;
