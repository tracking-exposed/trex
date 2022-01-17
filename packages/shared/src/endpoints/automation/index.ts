import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';

import { AutomationScenario } from '../../models/Automation';

const CreateScenario = Endpoint({
  Method: 'POST',
  getPath: () => 'v0/automation',
  Input: {
    Body: AutomationScenario,
  },
  Output: t.unknown,
});

export default {
  v0: {
    CreateScenario,
  }
};
