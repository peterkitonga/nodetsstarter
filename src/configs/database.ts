export default {
  provider: process.env.MONGO_PROVIDER,
  host: process.env.MONGO_HOST,
  port: process.env.MONGO_PORT,
  username: process.env.MONGO_USERNAME,
  password: process.env.MONGO_PASSWORD,
  name: process.env.MONGO_DATABASE,
  uri(): string {
    if (this.provider === 'atlas') {
      return `mongodb+srv://${this.username}:${this.password}@${this.host}/${this.name}?retryWrites=true&w=majority`;
    } else {
      return `mongodb://${this.username}:${this.password}@${this.host}:${this.port}/${this.name}`;
    }
  },
};
