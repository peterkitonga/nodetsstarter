export default jest.fn().mockImplementation(() => ({
  info: jest.fn(),
  error: jest.fn(),
}));
