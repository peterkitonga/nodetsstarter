import { connect } from 'mongoose';
import { ConnectionResponse } from '../interfaces/database';

import configs from '../configs';

export const mongoConnect = (): Promise<ConnectionResponse> => {
  return new Promise((resolve, reject) => {
    connect(configs.database.uri(), { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
      .then(() => resolve({ status: 'success', message: 'MONGO CONNECTED!' }))
      .catch((err) => reject({ status: 'error', message: err.message }));
  });
};
