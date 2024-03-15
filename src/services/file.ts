import crypto from 'crypto';
import { Service } from 'typedi';
import { unlink, symlink, writeFile } from 'fs/promises';

import configs from '@src/configs';
import { publicPath } from '@src/utils/path';
import SThreeClient from '@src/core/aws-sthree';
import { AppResponse } from '@src/shared/interfaces/responses';

@Service()
export default class FileStorageService {
  public constructor(private sThreeClient: SThreeClient) {
    //
  }

  public async storeFile(base64String: string): Promise<AppResponse<string>> {
    try {
      const storageProvider = configs.filesystems.provider;

      const fileExt = base64String.substring(base64String.indexOf('/') + 1, base64String.indexOf(';base64'));
      const fileType = base64String.substring('data:'.length, base64String.indexOf(';base64'));
      const fileName = `${crypto.randomBytes(12).toString('hex')}-${Date.now()}.${fileExt}`;
      const base64File = base64String.split(';base64,').pop();

      if (storageProvider === 'local') {
        return await this.storeLocalFile(fileName, base64File!);
      } else {
        return await this.storeCloudFile(fileName, base64File!, fileType);
      }
    } catch (err) {
      throw err;
    }
  }

  public async deleteFile(fileUrl: string): Promise<AppResponse<string>> {
    try {
      const storageProvider = configs.filesystems.provider;

      if (storageProvider === 'local') {
        const baseFileUrl = `${configs.filesystems.providers.local.url}/`;
        const fileName = fileUrl.substring(baseFileUrl.length, fileUrl.length);

        return await this.deleteLocalFile(fileName);
      } else {
        const bucketName = configs.filesystems.providers.s3.bucket;
        const bucketEndpoint = configs.filesystems.providers.s3.endpoint;
        const baseFileUrl = `${bucketEndpoint}/${bucketName}/`;
        const fileName = fileUrl.substring(baseFileUrl.length, fileUrl.length);

        return await this.deleteCloudFile(fileName);
      }
    } catch (err) {
      throw err;
    }
  }

  private async storeLocalFile(fileName: string, base64File: string): Promise<AppResponse<string>> {
    try {
      const filePath = `${configs.filesystems.providers.local.dir}/${fileName}`;

      const absoluteTarget = filePath;
      const absolutePath = publicPath(`storage/${fileName}`);

      await writeFile(filePath, base64File!, { encoding: 'base64' });
      await symlink(absoluteTarget, absolutePath);

      return { data: `${configs.filesystems.providers.local.url}/${fileName}` };
    } catch (err) {
      throw err;
    }
  }

  private async deleteLocalFile(fileName: string): Promise<AppResponse<string>> {
    try {
      const filePath = `${configs.filesystems.providers.local.dir}/${fileName}`;

      await unlink(publicPath(`storage/${fileName}`));
      await unlink(filePath);

      return { data: `${configs.filesystems.providers.local.url}/${fileName}` };
    } catch (err) {
      throw err;
    }
  }

  private async storeCloudFile(fileName: string, base64File: string, fileType: string): Promise<AppResponse<string>> {
    const bucketName = configs.filesystems.providers.s3.bucket;
    const bucketEndpoint = configs.filesystems.providers.s3.endpoint;

    try {
      await this.sThreeClient.saveToBucket(fileName, fileType, Buffer.from(base64File!, 'base64'));

      return {
        data: `${bucketEndpoint}/${bucketName}/${fileName}`,
      };
    } catch (err) {
      throw err;
    }
  }

  private async deleteCloudFile(fileName: string): Promise<AppResponse<string>> {
    const bucketName = configs.filesystems.providers.s3.bucket;
    const bucketEndpoint = configs.filesystems.providers.s3.endpoint;

    try {
      await this.sThreeClient.deleteFromBucket(fileName);
      return {
        data: `${bucketEndpoint}/${bucketName}/${fileName}`,
      };
    } catch (err) {
      throw err;
    }
  }
}
