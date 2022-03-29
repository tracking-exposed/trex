import { HTML } from '../../models/HTML';
import { Metadata } from '../../models/Metadata';
import { MongoClient } from 'mongodb';
import mongo3 from '../../lib/mongo3';
import { Supporter } from 'models/Supporter';

export interface HTMLSource {
  html: HTML;
  jsdom: Document;
  supporter: Supporter;
  impression: any;
}

export type ParserFn = (html: HTMLSource, findings?: any) => any | null;


export interface PipelineResults {
  failures: Record<string, any>;
  source: HTMLSource;
  log: Record<string, any>;
  findings: Record<string, any>;
}

export interface ParsingChainResults {
  findings: number[];
  failures: number[];
  logof: Array<[number, number] | null>;
  metadata: Metadata[];
}

export interface ExecuteParams {
  filter?: string[];
  stop: number;
  repeat: boolean;
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

export interface ParserProviderContext {
  db: {
    api: typeof mongo3;
    read: MongoClient;
    write: MongoClient;
  };
  parsers: Record<string, ParserFn>;
  toMetadata: (e: PipelineResults | null) => any;
}
