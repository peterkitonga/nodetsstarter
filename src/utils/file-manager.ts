import { unlink, symlink, writeFile } from 'fs';

import configs from '../configs';
import { publicPath } from '../utils/path';
import { ResultResponse } from '../common/interfaces/responses';

export const storeLocalFile = (base64String: string): Promise<ResultResponse<string>> => {
  const fileExt = base64String.substring(base64String.indexOf('/') + 1, base64String.indexOf(';base64'));
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${configs.filesystems.providers.local.dir}/${fileName}`;
  const base64File = base64String.split(';base64,').pop();

  return new Promise((resolve, reject) => {
    writeFile(filePath, base64File!, { encoding: 'base64' }, (err) => {
      if (err) {
        reject({ status: 'error', message: err.message });
      } else {
        const absoluteTarget = filePath;
        const absolutePath = publicPath(`storage/${fileName}`);

        /**
         * Create symlink to the public/storage folder
         */
        symlink(absoluteTarget, absolutePath, (err) => {
          if (err) {
            reject({ status: 'error', message: err.message });
          } else {
            resolve({ status: 'success', data: `${configs.filesystems.providers.local.url}/${fileName}` });
          }
        });
      }
    });
  });
};

export const deleteLocalFile = (fileName: string): Promise<ResultResponse<string>> => {
  const filePath = `${configs.filesystems.providers.local.dir}/${fileName}`;

  return new Promise((resolve, reject) => {
    unlink(filePath, (err) => {
      if (err) {
        reject({ status: 'error', message: err.message });
      } else {
        resolve({ status: 'success', data: filePath });
      }
    });
  });
};
