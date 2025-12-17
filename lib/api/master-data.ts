import apiClient from './client';

export interface EvaluationCenter {
    id: number;
    name: string;
    code: string;
}

export interface Hon {
    id: number;
    name: string;
    code: string;
}

export interface Part {
    id: number;
    name: string;
    code: string;
    hon_id: number;
}

export interface Snr {
    id: number;
    name: string;
    code: string;
    parent_part_id: number;
}

export const masterDataApi = {
    getEvaluationCenters: async (): Promise<EvaluationCenter[]> => {
        const response = await apiClient.get<EvaluationCenter[]>('/evaluation-centers');
        return response.data;
    },

    getHons: async (): Promise<Hon[]> => {
        const response = await apiClient.get<Hon[]>('/master-data/hons');
        return response.data;
    },

    getParts: async (honId: number): Promise<Part[]> => {
        const response = await apiClient.get<Part[]>('/master-data/parts', {
            params: { hon_id: honId },
        });
        return response.data;
    },

    getSnrs: async (parentPartId: number): Promise<Snr[]> => {
        const response = await apiClient.get<Snr[]>('/master-data/snrs', {
            params: { parent_part_id: parentPartId },
        });
        return response.data;
    },
};
