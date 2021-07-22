export default (_target: unknown, _name: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
  const original = descriptor.value;
  const adjusted: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      return original.bind(this);
    },
  };

  return adjusted;
};
