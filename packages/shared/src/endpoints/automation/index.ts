import * as t from 'io-ts';
import { Endpoint } from 'ts-endpoint';

import { AutomationScenario } from '../../models/Automation';

const CreateScenario = Endpoint({
  Method: 'POST',
  getPath: () => `automation/v0`,
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
