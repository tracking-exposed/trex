/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { keys, record } from 'fp-ts/lib/Record';
import * as t from 'io-ts';
import * as NEA from 'io-ts-types/lib/nonEmptyArray';
import { Directive } from '../../models/Directive';

// interface NonEmptyArrayTypeT<C extends t.Mixed>
//   extends t.Type<
//     NonEmptyArray<t.TypeOf<C>>,
//     Array<t.OutputOf<C>>,
//     unknown
//   > {}
interface NEArrayType extends NEA.NonEmptyArrayC<HasOpenAPISchema> {}
interface ArrayType extends t.ArrayType<HasOpenAPISchema> {}
interface RecordType extends t.DictionaryType<t.StringType, HasOpenAPISchema> {}
interface StructType
  extends t.InterfaceType<{ [K: string]: t.TypeOf<HasOpenAPISchema> }> {}
interface ExactType extends t.ExactType<HasOpenAPISchema> {}
interface TupleType extends t.TupleType<HasOpenAPISchema[]> {}
interface PartialType extends t.PartialType<Record<string, HasOpenAPISchema>> {}
interface UnionType extends t.UnionType<HasOpenAPISchema[]> {}
interface IntersectionType extends t.IntersectionType<HasOpenAPISchema[]> {}
interface BrandedType extends t.RefinementType<HasOpenAPISchema> {}

export type HasOpenAPISchema =
  | t.UnknownType
  | t.UndefinedType
  | t.NullType
  | t.VoidType
  | t.StringType
  | t.NumberType
  | t.BooleanType
  | t.KeyofType<any>
  | t.LiteralType<any>
  | t.PartialType<any>
  | ArrayType
  | RecordType
  | StructType
  | ExactType
  | PartialType
  | TupleType
  | UnionType
  | IntersectionType
  | BrandedType;

function getProps(
  codec: t.InterfaceType<any> | t.ExactType<any> | t.PartialType<any>
): t.Props {
  switch (codec._tag) {
    case 'InterfaceType':
    case 'PartialType':
      return codec.props;
    case 'ExactType':
      return getProps(codec.type);
  }
}

const objectTypes = ['ExactType', 'InterfaceType', 'PartialType'];

export const getInnerSchemaName = (tt: string): string => {
  if (tt.startsWith('Array<')) {
    return tt.replace('Array<', '').replace('>', '');
  }

  return tt;
};
// const isNEA = (type: unknown): type is NEA.NonEmptyArrayC<any> => {
//   console.log('is NEA', type);
//   return type !== undefined && (type as any).name.startsWith('NonEmptyArray<');
// };

export type IOTOpenDocSchema = HasOpenAPISchema | NEArrayType;

export const getOpenAPISchema = <T extends IOTOpenDocSchema>(codec: T): any => {
  const type: HasOpenAPISchema = codec as any;
  // console.log('type', type._tag);

  if (type.name === 'Array<string>') {
    return {
      type: 'array',
      items: [
        {
          type: 'string',
        },
      ],
      required: false,
    };
  }

  switch (type._tag) {
    case 'UnknownType':
      return { type: 'object', description: type.name };
    case 'UndefinedType':
    case 'VoidType':
      return { type: 'undefined', description: 'An undefined type' };
    case 'NullType':
      return { type: 'null', description: type.name, nullable: true };
    case 'StringType':
      return { type: 'string', description: type.name };
    case 'NumberType':
      return { type: 'number', format: 'integer32' };
    case 'BooleanType':
      return { type: 'boolean', description: 'A valid boolean type' };
    case 'KeyofType':
      return {
        type: 'string',
        enum: keys(type.keys),
        // oneOf: .map((k) => ({
        //   type: 'string',
        //   default: k,
        // })),
      };
    case 'LiteralType':
      return { type: 'string', default: type.value };
    case 'ArrayType':
      return {
        type: 'array',
        description: type.name
          .replace('Array<', '')
          .replace('>', '')
          .concat('[]'),
        items: [
          {
            $ref: `#/components/schemas/${type.type.name}`,
          },
        ],
      };
    case 'DictionaryType':
      // fc.dictionary(getArbitrary(type.domain), getArbitrary(type.codomain)) as any;
      return {
        type: 'object',
        properties: {},
      };

    case 'InterfaceType':
    case 'PartialType':
    case 'ExactType': {
      const properties = record.map(
        getProps(type),
        getOpenAPISchema as any
      ) as any;
      return {
        type: 'object',
        description: type.name,
        properties,
      };
    }
    case 'TupleType':
      return { type: 'array', items: type.types.map(getOpenAPISchema) };
    case 'UnionType':
      const nonNullableTypes = type.types.filter(
        (t) => t._tag !== 'UndefinedType' && t._tag !== 'NullType'
      );
      const isRequired = type.types.length === nonNullableTypes.length;
      if (nonNullableTypes.every((v) => v._tag === 'LiteralType')) {
        return {
          type: 'string',
          description: type.name,
          enum: (nonNullableTypes as Array<t.LiteralType<any>>).map(
            (t) => t.value
          ),
          required: isRequired,
        };
      }

      if (nonNullableTypes.length === 1) {
        if (nonNullableTypes[0]._tag === 'BooleanType') {
          return {
            type: 'boolean',
            description: 'A valid boolean type',
            required: isRequired,
          };
        }

        if (nonNullableTypes[0]._tag === 'StringType') {
          return {
            type: 'string',
            description: nonNullableTypes[0].name,
            required: isRequired,
          };
        }
      }

      return {
        type: 'object',
        description: type.name,
        oneOf: nonNullableTypes.map(getOpenAPISchema),
        required: isRequired,
      };

    case 'IntersectionType':
      const isObjectIntersection = objectTypes.includes(type.types[0]._tag);
      const schema = isObjectIntersection
        ? {
            type: 'object',
            properties: type.types
              .map((t) => getOpenAPISchema(t))
              .reduce((acc, values: unknown) => {
                return Object.assign(acc, (values as any).properties);
              }, {}),
          }
        : {
            type: 'object',
            properties: type.types.map((t) => getOpenAPISchema(t)),
          };

      return schema;
    case 'RefinementType': {
      return getOpenAPISchema(type.type);
    }

    case undefined: {
      if (codec.name === 'DateFromISOString' || codec.name === 'Date') {
        return { type: 'string', format: 'date-time' };
      }

      if (codec.name === 'NumberFromString') {
        return {
          type: 'number',
        };
      }

      if (codec.name === 'Option<string>') {
        return {
          type: 'string',
          required: false,
        };
      }

      if (codec.name === 'GetDirectiveOutput') {
        return {
          type: 'array',
          items: Directive.types.map((tt) => ({
            $ref: `#/components/schemas/${tt.name}`,
          })),
          required: true,
        };
      }

      if (codec.name === undefined) {
        return {
          type: 'undefined',
          description: 'An `undefined` value',
          required: false,
        };
      }
      // console.log('unhandled codec', codec.name);
    }
  }
};
