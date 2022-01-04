import { GetAPI, TERequest } from '@shared/providers/api.provider';
import { command } from 'avenger';
import * as Endpoints from '@shared/endpoints';
import { TabouleQueries } from './queries';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

export interface TabouleCommands {
  deleteContribution: TERequest<
    typeof Endpoints.v2.Public.DeletePersonalContributionByPublicKey
  >;
  downloadAsCSV: TERequest<typeof Endpoints.v2.Public.SearchesAsCSV>;
}

export const GetTabouleCommands = (
  {
    baseURL,
  }: {
    baseURL: string;
  },
  queries: TabouleQueries
): TabouleCommands => {
  const API = GetAPI({ baseURL });
  const deleteContribution = command(
    (input: { Params: { publicKey: string; selector: string | undefined } }) =>
      API.API.v2.Public.DeletePersonalContributionByPublicKey({
        Params: {
          ...input.Params,
          selector: 'undefined',
        },
      }),
    {
      personalSearches: queries.personalSearches,
    }
  );

  const downloadAsCSV = command((input: { Params: { queryString: string } }) =>
    pipe(
      API.API.v2.Public.SearchesAsCSV({
        Params: input.Params,
      }),
      TE.map((content) => {
        const aElement = document.createElement('a');
        aElement.setAttribute(
          'href',
          'data:text/plain;charset=utf-8, ' + encodeURIComponent(content)
        );
        aElement.setAttribute('download', `${input.Params.queryString}.txt`);

        // Above code is equivalent to
        // <a href="path of file" download="file name">
        document.body.appendChild(aElement);

        //onClick property
        aElement.click();

        document.body.removeChild(aElement);
      })
    )
  );

  return {
    deleteContribution,
    downloadAsCSV,
  };
};
