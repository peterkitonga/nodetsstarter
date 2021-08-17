import { unlink, symlink, writeFile } from 'fs/promises';

import configs from '../configs';
import { publicPath } from '../utils/path';
import SThreeClient from '../loaders/aws-sthree';
import { ResultResponse } from '../common/interfaces/responses';

export default class FileStorageService {
  public constructor() {
    //
  }

  public async storeFile(base64String: string): Promise<ResultResponse<string>> {
    try {
      const storageProvider = configs.filesystems.provider;

      const fileExt = base64String.substring(base64String.indexOf('/') + 1, base64String.indexOf(';base64'));
      const fileType = base64String.substring('data:'.length, base64String.indexOf(';base64'));
      const base64File = base64String.split(';base64,').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      if (storageProvider === 'local') {
        return await this.storeLocalFile(fileName, base64File!);
      } else {
        return await this.storeCloudFile(fileName, base64File!, fileType);
      }
    } catch (err) {
      throw err;
    }
  }

  public async deleteFile(fileUrl: string): Promise<ResultResponse<string>> {
    try {
      const storageProvider = configs.filesystems.provider;

      if (storageProvider === 'local') {
        const baseFileUrl = `${configs.filesystems.providers.local.url}/`;
        const fileName = fileUrl.substring(baseFileUrl.length, fileUrl.length);

        return await this.deleteLocalFile(fileName);
      } else {
        const bucketName = configs.filesystems.providers.s3.bucket;
        const bucketRegion = configs.filesystems.providers.s3.region;
        const baseFileUrl = `https://s3.${bucketRegion}.amazonaws.com/${bucketName}/`;
        const fileName = fileUrl.substring(baseFileUrl.length, fileUrl.length);

        return await this.deleteCloudFile(fileName);
      }
    } catch (err) {
      throw err;
    }
  }

  private async storeLocalFile(fileName: string, base64File: string): Promise<ResultResponse<string>> {
    try {
      const filePath = `${configs.filesystems.providers.local.dir}/${fileName}`;

      const absoluteTarget = filePath;
      const absolutePath = publicPath(`storage/${fileName}`);

      await writeFile(filePath, base64File!, { encoding: 'base64' });
      await symlink(absoluteTarget, absolutePath);

      return Promise.resolve({ status: 'success', data: `${configs.filesystems.providers.local.url}/${fileName}` });
    } catch (err) {
      return Promise.reject({ status: 'error', message: err.message });
    }
  }

  private async deleteLocalFile(fileName: string): Promise<ResultResponse<string>> {
    try {
      const filePath = `${configs.filesystems.providers.local.dir}/${fileName}`;

      await unlink(publicPath(`storage/${fileName}`));
      await unlink(filePath);

      return Promise.resolve({ status: 'success', data: `${configs.filesystems.providers.local.url}/${fileName}` });
    } catch (err) {
      return Promise.reject({ status: 'error', message: err.message });
    }
  }

  private storeCloudFile(fileName: string, base64File: string, fileType: string): Promise<ResultResponse<string>> {
    const bucketName = configs.filesystems.providers.s3.bucket;
    const bucketRegion = configs.filesystems.providers.s3.region;

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
  }

  private deleteCloudFile(fileName: string): Promise<ResultResponse<string>> {
    const bucketName = configs.filesystems.providers.s3.bucket;
    const bucketRegion = configs.filesystems.providers.s3.region;

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
  }
}
