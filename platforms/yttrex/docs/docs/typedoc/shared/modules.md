---
id: 'modules'
title: '@yttrex/shared'
sidebar_label: 'Exports'
sidebar_position: 0.5
custom_edit_url: null
---

## Functions

### GetAPIClient

▸ **GetAPIClient**(`opts`): `Object`

#### Parameters

| Name   | Type            | Description   |
| :----- | :-------------- | :------------ |
| `opts` | `GetAPIOptions` | GetAPIOptions |

#### Returns

`Object`

An object with YTAPIClient to communicate with
YT endpoints and with HTTPClient for plain HTTP requests

| Name         | Type                     |
| :----------- | :----------------------- |
| `API`        | `APIClient`<`__module`\> |
| `HTTPClient` | `HTTPClient`             |

#### Defined in

[providers/api.provider.ts:21](https://github.com/tracking-exposed/trex/blob/ca350825/platforms/yttrex/shared/src/providers/api.provider.ts#L21)
