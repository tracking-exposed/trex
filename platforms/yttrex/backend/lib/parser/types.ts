import { Metadata } from '../../models/Metadata';
import { MongoClient } from 'mongodb';
import mongo3 from '../../lib/mongo3';

export type ParserFn<T> = (entry: T, findings?: any) => any | null;

export interface LastContributions<T> {
  errors: number;
  overflow: boolean;
  sources: T[];
}

export interface PipelineResults<T> {
  failures: Record<string, any>;
  source: T;
  log: Record<string, any>;
  findings: Record<string, any>;
}

export interface ParsingChainResults {
  findings: number[];
  failures: number[];
  // logof: Array<[number, number] | null>;
  metadata: Metadata[];
}

export interface ExecuteParams {
  filter?: string[];
  stop: number;
  repeat?: boolean;
  // exit after first run
  singleUse?: boolean | string;
  htmlAmount: number;
}

export type ExecutionOutput =
  | {
      type: 'Success';
      payload: any;
    }
  | {
      type: 'Error';
      payload: any;
    };

export interface ParserProviderOpts extends ExecuteParams {
  /* minutes to look back */
  backInTime: number;
}

export interface ParserProvider {
  run: (opts: ParserProviderOpts) => Promise<any>;
}

export interface ParserProviderContext<T> {
  db: {
    api: typeof mongo3;
    read: MongoClient;
    write: MongoClient;
  };
  parsers: Record<string, ParserFn<T>>;
  getContributions: (
    filter: any,
    skip: number,
    limit: number
  ) => Promise<LastContributions<T>>;
  getEntryNatureType: (e: T) => string;
  getEntryDate: (e: T) => Date;
  saveResults: (e: PipelineResults<T> | null) => Promise<{
    metadata: any;
    count: { [key: string]: number };
  } | null>;
}
