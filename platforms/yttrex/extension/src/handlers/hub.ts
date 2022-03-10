import hub, { Hub } from '@shared/extension/hub';
import { YTHubEvent } from '../models/HubEvent';

const ytHub = hub as Hub<YTHubEvent>;

export default ytHub;
