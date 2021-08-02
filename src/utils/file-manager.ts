import { unlink, symlink, writeFile } from 'fs';

import configs from '../configs';
import { publicPath } from '../utils/path';
import SThreeClient from '../loaders/aws-sthree';
import { ResultResponse } from '../common/interfaces/responses';

const storeLocalFile = (fileName: string, base64File: string): Promise<ResultResponse<string>> => {
  const filePath = `${configs.filesystems.providers.local.dir}/${fileName}`;

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

const deleteLocalFile = (fileName: string): Promise<ResultResponse<string>> => {
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

const storeCloudFile = (fileName: string, base64File: string, fileType: string): Promise<ResultResponse<string>> => {
  const bucketRegion = configs.filesystems.providers.s3.region;
  const bucketName = configs.filesystems.providers.s3.bucket;

  return SThreeClient.saveToBucket(fileName, fileType, Buffer.from(base64File!, 'base64'))
    .then(() => {
      return Promise.resolve({
        status: 'success',
        data: `https://s3.${bucketRegion}.amazonaws.com/${bucketName}/${fileName}`,
      });
    })
    .catch((err) => {
      return Promise.reject({ status: 'error', message: err.message });
    });
};

const deleteCloudFile = (fileName: string): Promise<ResultResponse<string>> => {
  const bucketRegion = configs.filesystems.providers.s3.region;
  const bucketName = configs.filesystems.providers.s3.bucket;

  return SThreeClient.deleteFromBucket(fileName)
    .then(() => {
      return Promise.resolve({
        status: 'success',
        data: `https://s3.${bucketRegion}.amazonaws.com/${bucketName}/${fileName}`,
      });
    })
    .catch((err) => {
      return Promise.reject({ status: 'error', message: err.message });
    });
};

export const storeFile = async (base64String: string): Promise<ResultResponse<string>> => {
  try {
    let response: ResultResponse<string>;
    const storageProvider = configs.filesystems.provider;

    const fileExt = base64String.substring(base64String.indexOf('/') + 1, base64String.indexOf(';base64'));
    const fileType = base64String.substring('data:'.length, base64String.indexOf(';base64'));
    const base64File = base64String.split(';base64,').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    if (storageProvider === 'local') {
      response = await storeLocalFile(fileName, base64File!);
    } else {
      response = await storeCloudFile(fileName, base64File!, fileType);
    }

    return response;
  } catch (err) {
    throw err;
  }
};

export const deleteFile = async (fileName: string): Promise<ResultResponse<string>> => {
  try {
    let response: ResultResponse<string>;
    const storageProvider = configs.filesystems.provider;

    if (storageProvider === 'local') {
      response = await deleteLocalFile(fileName);
    } else {
      response = await deleteCloudFile(fileName);
    }

    return response;
  } catch (err) {
    throw err;
  }
};
