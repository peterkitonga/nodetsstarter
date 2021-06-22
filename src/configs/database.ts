import { connect } from 'mongoose';

const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_HOST = process.env.MONGO_HOST;
const MONGO_DATABASE = process.env.MONGO_DATABASE;

const mongodbUri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}?retryWrites=true&w=majority`;

interface ConnectionResponse {
    status: string; 
    message: string;
}

export const mongoConnect = (): Promise<ConnectionResponse> => {
    return new Promise((resolve, reject) => {
        connect(mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
        .then(() => resolve({ status: 'success', message: 'MONGO CONNECTED!' }))
        .catch(err => reject({ status: 'error', message: err.message }));
    });
};