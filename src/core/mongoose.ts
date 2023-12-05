import { connect, connection } from 'mongoose';

import configs from '@src/configs';
import { AppResponse } from '@src/shared/interfaces/responses';

class MongooseConnect {
  public constructor() {
    // constructor
  }

  public async connect(): Promise<AppResponse<null>> {
    try {
      await connect(configs.database.uri());

      return { status: 'success', message: 'MONGO CONNECTED!' };
    } catch (err) {
      throw err;
    }
  }

  public async disconnect(): Promise<AppResponse<null>> {
    try {
      await connection.close(false);

      return { status: 'success', message: 'MONGO DISCONNECTED!' };
    } catch (err) {
      throw err;
    }
  }
}

export default new MongooseConnect();
