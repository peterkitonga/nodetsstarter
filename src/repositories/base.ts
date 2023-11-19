abstract class BaseRepository<T> {
  abstract create(item: T): Promise<boolean>;
  abstract update(identifier: string, item: T): Promise<boolean>;
  abstract delete(identifier: string): Promise<boolean>;
}
