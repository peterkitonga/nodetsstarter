abstract class BaseRepository<T> {
  abstract create(doc: T): Promise<T | boolean>;
  abstract update(field: string, value: string, updatedDoc: T): Promise<T | boolean>;
  abstract delete(field: string, value: string): Promise<T | boolean>;
  protected buildFilterObject(field: string, value: unknown): { [key: string]: unknown } {
    const filter = {} as { [key: string]: unknown };
    filter[field] = value;

    return filter;
  }
}
