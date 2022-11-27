import * as t from 'io-ts';
import { SigiState } from '../../sigiState/SigiState';
import { ListOutput } from '@shared/models/http/Output';

/**
 * The codec for the the Output of GET /v2/metadata endpoint
 */
export const ListSigiStateOutput = ListOutput(SigiState, 'ListSigiStateOutput');

export type ListSigiStateOutput = t.TypeOf<typeof ListSigiStateOutput>;
