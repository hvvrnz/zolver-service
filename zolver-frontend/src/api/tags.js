import client from './client';

export const getTags    = ()                          => client.get('/api/v1/tags');
export const createTag  = (data)                      => client.post('/api/v1/tags', data);
export const updateTag  = (tagId, data)               => client.put(`/api/v1/tags/${tagId}`, data);
export const deleteTag  = (tagId)                     => client.delete(`/api/v1/tags/${tagId}`);