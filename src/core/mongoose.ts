import { Service } from 'typedi';
import { connect, connection } from 'mongoose';

import configs from '@src/configs';
import { AppResponse } from '@src/shared/interfaces/responses';

@Service()
export default class MongooseConnect {
  constructor() {
    // constructor
  }

  public async connect(): Promise<AppResponse<null>> {
    try {
      await connect(configs.database.uri());

      return { message: 'MONGO CONNECTED!' };
    } catch (err) {
      throw err;
    }
  }

  public async disconnect(): Promise<AppResponse<null>> {
    try {
      await connection.close(false);

      return { message: 'MONGO DISCONNECTED!' };
    } catch (err) {
      throw err;
    }
  }
}
