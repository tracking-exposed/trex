import { Hub } from '@shared/extension/hub';
import { TKHubEvent } from '../models/HubEvent';

const tkHub = new Hub<TKHubEvent>();

export default tkHub;
