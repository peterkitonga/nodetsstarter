abstract class BaseRepository<T> {
  abstract create(doc: T): Promise<boolean>;
  abstract update(field: string, value: string, updatedDoc: T): Promise<T>;
  abstract delete(field: string, value: string): Promise<boolean>;
}
