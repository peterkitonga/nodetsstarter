import { S3Client, PutObjectCommand, PutObjectCommandOutput, DeleteObjectCommand } from '@aws-sdk/client-s3';

import configs from '../configs';
import { ResultResponse } from '../common/interfaces/responses';

class SThreeClient {
  private client: S3Client;
  private bucketName: string;

  public constructor() {
    this.client = new S3Client({
      region: configs.filesystems.providers.s3.region,
      credentials: {
        accessKeyId: configs.filesystems.providers.s3.key!,
        secretAccessKey: configs.filesystems.providers.s3.secret!,
      },
    });
    this.bucketName = configs.filesystems.providers.s3.bucket!;
  }

  public async saveToBucket(fileName: string, fileType: string, fileContent: Buffer): Promise<ResultResponse<null>> {
    try {
      const allUsers = 'uri=http://acs.amazonaws.com/groups/global/AllUsers';
      const authUsers = 'uri=http://acs.amazonaws.com/groups/global/AuthenticatedUsers';

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: fileContent,
          ContentType: fileType,
          GrantFullControl: `id=${configs.filesystems.providers.s3.owner}`,
          GrantRead: `${allUsers},${authUsers}`,
        }),
      );

      return {
        status: 'success',
        message: `Successfully uploaded '${fileName}' to AWS S3 bucket '${this.bucketName}'`,
      };
    } catch (err) {
      throw err;
    }
  }

  public async deleteFromBucket(fileName: string): Promise<ResultResponse<null>> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
        }),
      );

      return {
        status: 'success',
        message: `Successfully deleted '${fileName}' from AWS S3 bucket '${this.bucketName}'`,
      };
    } catch (err) {
      throw err;
    }
  }
}

export default new SThreeClient();
