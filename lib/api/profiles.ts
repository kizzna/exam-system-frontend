import apiClient from './client';
import type {
    Profile,
    CreateProfileRequest,
    UpdateProfileRequest,
} from '../types/profiles';

/**
 * Get all profiles
 */
export async function getProfiles(): Promise<Profile[]> {
    const response = await apiClient.get<Profile[]>('/api/profiles/');
    return response.data;
}

/**
 * Get a single profile by ID
 */
export async function getProfile(id: number): Promise<Profile> {
    const response = await apiClient.get<Profile>(`/api/profiles/${id}`);
    return response.data;
}

/**
 * Create a new profile
 */
export async function createProfile(data: CreateProfileRequest): Promise<Profile> {
    const response = await apiClient.post<Profile>('/api/profiles/', data);
    return response.data;
}

/**
 * Update a profile
 */
export async function updateProfile(id: number, data: UpdateProfileRequest): Promise<Profile> {
    const response = await apiClient.put<Profile>(`/api/profiles/${id}`, data);
    return response.data;
}

/**
 * Delete a profile
 */
export async function deleteProfile(id: number): Promise<void> {
    await apiClient.delete(`/api/profiles/${id}`);
}

/**
 * Clone a profile
 */
export async function cloneProfile(id: number, newName: string): Promise<Profile> {
    const response = await apiClient.post<Profile>(`/api/profiles/${id}/clone`, null, {
        params: { new_name: newName },
    });
    return response.data;
}

export const profilesAPI = {
    getAll: getProfiles,
    get: getProfile,
    create: createProfile,
    update: updateProfile,
    delete: deleteProfile,
    clone: cloneProfile,
};
