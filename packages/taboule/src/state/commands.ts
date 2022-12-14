import { APIError } from '@shared/errors/APIError';
import { TERequest } from '@shared/providers/api.provider';
import * as TKEndpoints from '@tktrex/shared/endpoints';
import { ListMetadataQuery as TKListMetadataQuery } from '@tktrex/shared/models/http/query/ListMetadata.query';
import * as YTEndpoints from '@yttrex/shared/endpoints';
import { ListMetadataQuery as YTListMetadataQuery } from '@yttrex/shared/models/http/metadata/query/ListMetadata.query';
import { command } from 'avenger';
import { APIClients } from '../config/config.type';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

const downloadFile = (filename: string, content: string): void => {
  const aElement = document.createElement('a');
  aElement.setAttribute(
    'href',
    'data:text/plain;charset=utf-8, ' + encodeURIComponent(content)
  );
  aElement.setAttribute('download', `${filename}.csv`);

  // Above code is equivalent to
  // <a href="path of file" download="file name">
  document.body.appendChild(aElement);

  // onClick property
  aElement.click();

  document.body.removeChild(aElement);
};
export interface TabouleCommands {
  ytDownloadAsCSV: TERequest<
    typeof YTEndpoints.v2.Metadata.ListMetadata,
    undefined
  >;
  tkDownloadAsCSV: TERequest<
    typeof TKEndpoints.v2.Metadata.ListMetadata,
    undefined
  >;
  downloadSearchesAsCSV: TERequest<typeof YTEndpoints.v2.Public.SearchesAsCSV>;
  deleteContribution: TERequest<
    typeof YTEndpoints.v2.Public.DeletePersonalContributionByPublicKey
  >;
}

export const GetTabouleCommands = (clients: APIClients): TabouleCommands => {
  const deleteContribution = command(
    (input: { Params: { publicKey: string; selector: string | undefined } }) =>
      clients.YT.v2.Public.DeletePersonalContributionByPublicKey({
        Params: {
          ...input.Params,
          selector: 'undefined',
        },
      })
  );

  const ytDownloadAsCSV = command<
    { Query: YTListMetadataQuery },
    APIError,
    undefined
  >(({ Query: { filter, ...query } }) =>
    pipe(
      clients.YT.v2.Metadata.ListMetadata({
        ValidateOutput: false,
        Query: {
          ...query,
          amount: 10000,
          format: 'csv',
          filter,
        },
      } as any),
      TE.map((content) => {
        downloadFile(filter?.nature ?? 'all', content as any);
        return undefined;
      })
    )
  );

  const tkDownloadAsCSV = command<
    { Query: TKListMetadataQuery },
    APIError,
    undefined
  >(({ Query: { filter, ...query } }) =>
    pipe(
      clients.TK.v2.Metadata.ListMetadata({
        Query: {
          ...query,
          amount: 10000,
          format: 'csv',
          filter,
        },
      }),
      TE.map((content) =>
        downloadFile(filter?.nature ?? 'all', content as any)
      ),
      TE.map(() => undefined)
    )
  );

  const downloadSearchesAsCSV = command(
    (input: { Params: { queryString: string } }) =>
      pipe(
        clients.YT.v2.Public.SearchesAsCSV({
          Params: input.Params,
        }),
        TE.map((content) => {
          downloadFile(input.Params.queryString.replaceAll(' ', '-'), content);
        })
      )
  );

  return {
    deleteContribution,
    ytDownloadAsCSV,
    tkDownloadAsCSV,
    downloadSearchesAsCSV,
  };
};
