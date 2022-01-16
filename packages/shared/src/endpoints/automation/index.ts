import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';

import { AutomationScenario } from '../../models/Automation';

const RequestResult = t.type(
  {
    ok: t.boolean,
  },
  'RequestResult'
);

const CreateScenario = Endpoint({
  Method: 'POST',
  getPath: () => `automation/v0`,
  Input: {
    Body: AutomationScenario,
  },
  Output: RequestResult,
});

export default {
  v0: {
    CreateScenario,
  }
};
