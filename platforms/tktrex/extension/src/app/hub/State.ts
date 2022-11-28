import { SigiStateType } from '@tktrex/models/sigiState/SigiState';
import {
  APIRequestEvent,
  NativeVideoEvent,
  NewVideoEvent,
  ProfileEvent,
  SearchEvent,
  SigiStateEvent,
  SuggestedEvent,
} from './HubEvent';

interface EvidenceMetaData {
  clientTime: string;
  incremental: number;
}

type VideoEvidence = NewVideoEvent['payload'] &
  EvidenceMetaData & { type: 'video' };
type SuggestedEvidence = SuggestedEvent['payload'] &
  EvidenceMetaData & { type: 'suggested' };
type APIRequestEvidence = APIRequestEvent['payload'] &
  EvidenceMetaData & { type: 'api' };
type SigiStateEvidence = SigiStateEvent['payload'] & {
  type: SigiStateType;
};
type NativeEvidence = NativeVideoEvent['payload'] &
  EvidenceMetaData & { type: 'native' };
type SearchEvidence = SearchEvent['payload'] &
  EvidenceMetaData & { type: 'search' };
type ProfileEvidence = ProfileEvent['payload'] &
  EvidenceMetaData & { type: 'profile' };

type Evidence =
  | VideoEvidence
  | SuggestedEvidence
  | NativeEvidence
  | SearchEvidence
  | ProfileEvidence
  | APIRequestEvidence
  | SigiStateEvidence;

export interface HubState {
  incremental: number;
  content: Evidence[];
}
