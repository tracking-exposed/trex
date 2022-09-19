const chalk = {
  green: jest.fn().mockImplementation((out) => out),
  yellow: jest.fn().mockImplementation((out) => out),
  red: jest.fn().mockImplementation((out) => out),
}
export default chalk;
