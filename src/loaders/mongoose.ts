import { connect, connection } from 'mongoose';

import configs from '../configs';
import { ResultResponse } from '../common/interfaces/responses';

class MongooseConnect {
  public constructor() {
    // constructor
  }

  public connect(): Promise<ResultResponse<null>> {
    return new Promise((resolve, reject) => {
      connect(configs.database.uri(), { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
        .then(() => resolve({ status: 'success', message: 'MONGO CONNECTED!' }))
        .catch((err) => reject({ status: 'error', message: err.message }));
    });
  }

  public disconnect(): Promise<ResultResponse<null>> {
    return new Promise((resolve, reject) => {
      connection
        .close(false)
        .then(() => resolve({ status: 'success', message: 'MONGO DISCONNECTED!' }))
        .catch((err) => reject({ status: 'error', message: err.message }));
    });
  }
}

export default new MongooseConnect();
