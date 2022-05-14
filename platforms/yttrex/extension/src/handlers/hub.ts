import { Hub } from '@shared/extension/hub';
import { YTHubEvent } from '../models/HubEvent';

const ytHub = new Hub<YTHubEvent>();

export default ytHub;
