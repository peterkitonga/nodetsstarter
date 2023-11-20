abstract class BaseRepository<T> {
  abstract create(doc: T): Promise<boolean>;
  abstract update(field: string, value: string, updatedDoc: T): Promise<T>;
  abstract delete(field: string, value: string): Promise<boolean>;
  protected buildFilterObject(field: string, value: unknown): { [key: string]: unknown } {
    const filter = {} as { [key: string]: unknown };
    filter[field] = value;

    return filter;
  }
}
