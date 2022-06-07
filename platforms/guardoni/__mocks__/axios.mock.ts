jest.mock('axios');
// eslint-disable-next-line import/first
import axios from 'axios';

const axiosMock = axios as jest.Mocked<typeof axios>;
axiosMock.create.mockImplementation(() => axiosMock);

export default axiosMock;
