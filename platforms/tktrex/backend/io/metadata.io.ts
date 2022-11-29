import { APIError, toAPIError } from '@shared/errors/APIError';
import { toValidationError } from '@shared/errors/ValidationError';
import { string2Food } from '@shared/utils/food.utils';
import {
  FollowingVideoMetadata,
  ForYouMetadata,
  HashtagMetadata,
  NativeMetadata,
  ProfileMetadata,
  SearchMetadata,
  TKMetadata
} from '@tktrex/shared/models/metadata';
import { TKMetadataBase as MetadataBase } from '@tktrex/shared/models/metadata/MetadataBase';
import {
  CreatorType,
  FollowingType,
  ForYouType,
  HashtagType,
  NativeType,
  ProfileType,
  SearchType
} from '@tktrex/shared/models/Nature';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import {
  FollowingVideoMetadataDB,
  ForYouMetadataDB,
  HashtagMetadataDB,
  NativeMetadataDB,
  ProfileMetadataDB,
  SearchMetadataDB,
  TKMetadataDB
} from '../models/metadata';

type SpecificM<M> = Omit<M, keyof Metadata | '_id' | 'publicKey'>;

/**
 * Map a `native` metadata from db to proper
 * api `native` metadata object
 * @param param0 The DB metadata
 * @param meta The common fields
 * @returns Metadata "native"
 */
export const toTKNativeMetadata = (
  { author, description, ...m }: SpecificM<NativeMetadataDB>,
  meta: MetadataBase
): NativeMetadata => {
  return {
    ...m,
    ...meta,
    description: description ?? undefined,
    author: author ?? undefined,
  };
};

/**
 * Map a `profile` metadata from db to proper
 * api `profile` metadata object
 * @param param0 The DB metadata
 * @param meta The common fields
 * @returns Metadata "profile"
 */

export const toProfileMetadata = (
  m: SpecificM<ProfileMetadataDB>,
  meta: MetadataBase
): ProfileMetadata => {
  return {
    ...m,
    ...meta,
  };
};

/**
 * Map a `tag` metadata from db to proper
 * api `tag` metadata object
 * @param param0 The DB metadata
 * @param meta The common fields
 * @returns Metadata "tag"
 */
export const toHashtagMetadata = (
  m: SpecificM<HashtagMetadataDB>,
  meta: MetadataBase
): HashtagMetadata => {
  return {
    ...m,
    ...meta,
  };
};

/**
 * Map a `foryou` metadata from db to proper
 * api `foryou` metadata object
 * @param param0 The DB metadata
 * @param meta The common fields
 * @returns Metadata "foryou"
 */
export const toForYouMetadata = (
  { author, music, hashtags, ...m }: SpecificM<ForYouMetadataDB>,
  meta: MetadataBase
): ForYouMetadata => {
  return {
    ...m,
    ...meta,
    author: author ?? undefined,
    music: music ?? undefined,
    hashtags: hashtags ?? [],
  };
};

/**
 * Map a `search` metadata from db to proper
 * api `search` metadata object
 * @param param0 The DB metadata
 * @param meta The common fields
 * @returns Metadata "search"
 */
export const toSearchMetadata = (
  m: SpecificM<SearchMetadataDB>,
  meta: MetadataBase
): SearchMetadata => {
  return { ...m, ...meta };
};

/**
 * Map a `following` metadata from db to proper
 * api `following` metadata object
 * @param param0 The DB metadata
 * @param meta The common fields
 * @returns Metadata "following"
 */
export const toFollowingMetadata = (
  m: SpecificM<FollowingVideoMetadataDB>,
  meta: MetadataBase
): FollowingVideoMetadata => {
  return { ...m, ...meta };
};

/**
 * Map a `tk` metadata from db to proper
 * api `tk` metadata object
 *
 *
 * @param m A metadata from the DB <TKMetadata>
 * @returns either an error or the metadata for the API <TKMetadata>
 */
export const toTKMetadata = ({
  publicKey,
  _id,
  id,
  blang,
  href,
  timelineId,
  savingTime,
  clientTime,
  experimentId,
  researchTag,
  ...m
}: TKMetadataDB): MetadataBase => {
  // common meta definition
  const meta: MetadataBase = {
    id: id.substring(0, 10),
    timelineId,
    blang,
    href,
    supporter: string2Food(publicKey),
    savingTime,
    clientTime,
    researchTag: researchTag ?? undefined,
    experimentId: experimentId ?? undefined,
  };

  // we cheat the compiler by setting `m` type to `any` for the switch;
  const mm: any = m;

  // based on the metadata nature type we extract
  // the metadata values by a proper mapping function
  switch (m.nature.type) {
    case SearchType.value: {
      return toSearchMetadata(mm, meta);
    }
    case ForYouType.value: {
      return toForYouMetadata(mm, meta);
    }
    case FollowingType.value: {
      return toFollowingMetadata(mm, meta);
    }
    case CreatorType.value:
    case ProfileType.value: {
      return toProfileMetadata(mm, meta);
    }
    case HashtagType.value: {
      return toHashtagMetadata(mm, meta);
    }

    case NativeType.value: {
      return toTKNativeMetadata(mm, meta);
    }
  }
};

export const decodeTKMetadata = (
  d: TKMetadataDB
): E.Either<APIError, TKMetadata> => {
  return pipe(
    // metadata mapping can fail, so we wrap it in a `E.tryCatch` and
    // use `toAppError` to convert any possible error to `AppError`
    E.tryCatch(() => toTKMetadata(d), toAPIError),
    E.chain((d) =>
      pipe(
        TKMetadata.decode(d),
        // in case of error we convert it to a `ValidationError` (`AppError`)
        E.mapLeft((err) => toValidationError(TKMetadata.name, err))
      )
    )
  );
};
