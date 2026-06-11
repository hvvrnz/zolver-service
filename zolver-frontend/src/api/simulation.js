import client from './client';

export const getSimulation    = ()                    => client.get('/api/v1/simulation');
export const createPlan       = (data)                => client.post('/api/v1/simulation/plans', data);
export const updatePlan       = (planId, data)        => client.put(`/api/v1/simulation/plans/${planId}`, data);
export const deletePlan       = (planId)              => client.delete(`/api/v1/simulation/plans/${planId}`);
export const createSimCourse  = (data)                => client.post('/api/v1/simulation/courses', data);
export const updateSimCourse  = (simCourseId, data)   => client.put(`/api/v1/simulation/courses/${simCourseId}`, data);
export const deleteSimCourse  = (simCourseId)         => client.delete(`/api/v1/simulation/courses/${simCourseId}`);