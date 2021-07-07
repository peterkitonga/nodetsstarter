import { connect } from 'mongoose';

import configs from '../configs';
import { CustomResponse } from '../common/interfaces/responses';

export default class MongooseConnect {
  private static instance: MongooseConnect;
  private uri: string;

  private constructor() {
    this.uri = configs.database.uri();
  }

  public static init(): MongooseConnect {
    if (!this.instance) {
      this.instance = new MongooseConnect();
    }

    return this.instance;
  }

  public connect(): Promise<CustomResponse> {
    return new Promise((resolve, reject) => {
      connect(this.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
        .then(() => resolve({ status: 'success', message: 'MONGO CONNECTED!' }))
        .catch((err) => reject({ status: 'error', message: err.message }));
    });
  }
}
