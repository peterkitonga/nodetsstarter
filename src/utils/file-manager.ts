import { relative, dirname } from 'path';
import { unlink, symlink, createWriteStream } from 'fs';

import { storagePath } from '../utils/path';
import { CustomResponse } from '../interfaces/responses';

export const storeLocalFile = (filename: string): Promise<CustomResponse> => {
  const filepath = storagePath(`app/public/${filename}`);

  return new Promise((resolve, reject) => {
    createWriteStream(filepath)
      .on('error', (err) => reject({ status: 'error', message: err.message }))
      .on('finish', () => {
        /**
         * Create symlink to the public folder
         *
         * @link https://stackoverflow.com/questions/29777506/create-relative-symlinks-using-absolute-paths-in-node-js#answer-57281866
         */
        const source = `/storage/app/public/${filename}`;
        const absoluteTarget = `/public/storage/${filename}`;
        const target = relative(dirname(source), absoluteTarget);

        symlink(target, source, (err) => {
          if (err) {
            reject({ status: 'error', message: err.message });
          } else {
            resolve({ status: 'success', data: filepath });
          }
        });
      });
  });
};

export const deleteLocalFile = (filename: string): Promise<CustomResponse> => {
  const filepath = storagePath(`app/public/${filename}`);

  return new Promise((resolve, reject) => {
    unlink(filepath, (err) => {
      if (err) {
        reject({ status: 'error', message: err.message });
      } else {
        resolve({ status: 'success', data: filepath });
      }
    });
  });
};
