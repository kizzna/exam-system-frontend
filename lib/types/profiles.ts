export interface ProfileConfig {
    bubble_detection?: {
        darkness_empty_threshold?: number;
        grid_density_min_threshold?: number;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface Profile {
    id: number;
    name: string;
    description: string | null;
    config_json: ProfileConfig;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateProfileRequest {
    name: string;
    description?: string;
    config_json: ProfileConfig;
    is_default?: boolean;
}

export interface UpdateProfileRequest {
    name?: string;
    description?: string;
    config_json?: ProfileConfig;
    is_default?: boolean;
}

export interface CloneProfileRequest {
    new_name: string;
}
