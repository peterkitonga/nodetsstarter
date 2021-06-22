import path from 'path';

export const public_path = (filepath?: string): string => {
    if (filepath !== undefined) {
        return path.join(__dirname, '../public', filepath);
    } else {
        return path.join(__dirname, '../public');
    }
};

export const storage_path = (filepath?: string): string => {
    if (filepath !== undefined) {
        return path.join(__dirname, '../storage', filepath);
    } else {
        return path.join(__dirname, '../storage');
    }
};