import { MakeAPIClient, TERequest } from '@shared/providers/api.provider';
import { command } from 'avenger';
import * as Endpoints from '@yttrex/shared/endpoints';
import { TabouleQueries } from './queries';
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
  deleteContribution: TERequest<
    typeof Endpoints.v2.Public.DeletePersonalContributionByPublicKey
  >;
  downloadAsCSV: TERequest<typeof Endpoints.v2.Public.GetPersonalCSV>;
  downloadSearchesAsCSV: TERequest<typeof Endpoints.v2.Public.SearchesAsCSV>;
}

export const GetTabouleCommands = (
  {
    baseURL,
  }: {
    baseURL: string;
  },
  queries: TabouleQueries
): TabouleCommands => {
  const API = MakeAPIClient(
    {
      baseURL,
      getAuth: async (req) => req,
      onUnauthorized: async (res) => res,
    },
    Endpoints
  );
  const deleteContribution = command(
    (input: { Params: { publicKey: string; selector: string | undefined } }) =>
      API.API.v2.Public.DeletePersonalContributionByPublicKey({
        Params: {
          ...input.Params,
          selector: 'undefined',
        },
      }),
    {
      youtubePersonalSearches: queries.youtubePersonalSearches,
    }
  );

  const downloadAsCSV = command(
    (input: {
      Params: { publicKey: string; type: 'home' | 'video' | 'search' };
    }) =>
      pipe(
        API.API.v2.Public.GetPersonalCSV({
          Params: input.Params,
        }),
        TE.map((content) => downloadFile(input.Params.type, content))
      )
  );

  const downloadSearchesAsCSV = command(
    (input: { Params: { queryString: string } }) =>
      pipe(
        API.API.v2.Public.SearchesAsCSV({
          Params: input.Params,
        }),
        TE.map((content) => {
          downloadFile(input.Params.queryString.replaceAll(' ', '-'), content);
        })
      )
  );

  return {
    deleteContribution,
    downloadAsCSV,
    downloadSearchesAsCSV,
  };
};
