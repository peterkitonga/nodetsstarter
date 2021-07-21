import { connect } from 'mongoose';

import configs from '../configs';
import { ResultResponse } from '../common/interfaces/responses';

export default class MongooseConnect {
  public constructor() {
    // constructor
  }

  public static connect(): Promise<ResultResponse<null>> {
    return new Promise((resolve, reject) => {
      connect(configs.database.uri(), { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
        .then(() => resolve({ status: 'success', message: 'MONGO CONNECTED!' }))
        .catch((err) => reject({ status: 'error', message: err.message }));
    });
  }
}
