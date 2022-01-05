import * as t from 'io-ts';

/**
 * Base type for all things that do not
 * parse to a key/value object map.
 */
const SimpleDefinitionBase = t.union([
  t.type({
    propType: t.union([
      t.literal('string'),
      t.literal('string[]'),
    ]),
    selectorType: t.union([
      t.literal('querySelector'),
      t.literal('querySelectorAll'),
    ]),
    selector: t.string,
  }),
  t.type({
    propType: t.union([
      t.literal('string'),
      t.literal('string[]'),
    ]),
    selectorType: t.literal('none'),
  }),
], 'SimpleDefinitionBase');


/**
 * Base type for all things that parse to a
 * key/value object map.
 */
const ObjectDefinitionBase = t.type({
  propType: t.literal('object'),
  properties: t.record(t.string, SimpleDefinitionBase),
}, 'ObjectDefinitionBase');


/**
 * Base type for the definition of how to parse
 * any property of a scraper definition.
 */
const PropDefinitionBase = t.union([
  SimpleDefinitionBase,
  ObjectDefinitionBase,
], 'PropDefinitionBase');

/**
 * Type for the actions that can optionally
 * be performed after the matching stage.
 */
const ActionDefinition = t.union([
  t.type({
    action: t.literal('filter'),
    filter: t.type({
      startsWith: t.string,
    }),
  }, 'ActionFilter'),

  t.type({
    action: t.literal('concatenate'),
    concatenate: t.array(
      t.union([
        t.string,
        t.array(t.string),
      ]),
    ),
  }, 'ActionConcatenate'),

  t.type({
    action: t.literal('getAttribute'),
    getAttribute: t.string,
  }, 'ActionGetAttribute'),

  t.type({}),
], 'ActionDefinition');


/**
 * Here we combine the selectors with the actions.
 */
const PropDefinition = t.intersection([
  PropDefinitionBase,
  ActionDefinition,
], 'PropDefinition');


/**
 * And finally we obtain the definition of a scraper.
 */
export const ScraperDefinition = t.record(
  t.string,
  PropDefinition,
  'ScraperDefinition',
);

export type ScraperDefinition = t.TypeOf<typeof ScraperDefinition>;

export default ScraperDefinition;
