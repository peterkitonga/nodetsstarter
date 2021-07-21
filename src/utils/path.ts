import path from 'path';

export const publicPath = (filepath?: string): string => {
  if (filepath !== undefined) {
    return path.join(__dirname, '../public', filepath);
  } else {
    return path.join(__dirname, '../public');
  }
};

export const storagePath = (filepath?: string): string => {
  if (filepath !== undefined) {
    return path.join(__dirname, '../storage', filepath);
  } else {
    return path.join(__dirname, '../storage');
  }
};

export const viewPath = (filepath?: string): string => {
  if (filepath !== undefined) {
    return path.join(__dirname, '../views', filepath);
  } else {
    return path.join(__dirname, '../views');
  }
};
