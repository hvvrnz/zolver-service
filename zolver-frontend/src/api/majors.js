import client from './client';

export const getMyMajors    = ()                        => client.get('/api/v1/majors');
export const createMajor    = (data)                    => client.post('/api/v1/majors', data);
export const updateMajor    = (userMajorId, data)       => client.put(`/api/v1/majors/${userMajorId}`, data);
export const deleteMajor    = (userMajorId)             => client.delete(`/api/v1/majors/${userMajorId}`);