---
id: 'index'
title: '@yttrex/backend'
sidebar_label: 'Readme'
sidebar_position: 0
custom_edit_url: null
---

# YTTREX BACKEND

This is the backend implementation of [youtube.tracking.exposed](https://youtube.tracking.exposed)

## Develop

### Install dependencies

Project bootstrapping requires to install `node` dependencies and `mongo`.

```bash
$ yarn // install node deps
// install mongo
$ mongo ./scripts/build-indexes.js
```

### Run server

Run `yarn watch` to start the development server.

**Optional:** the project can be also bootstrapped with `docker-compose up`

### Current API list

_paging_ is always optional.

# Personal

- https://youtube.tracking.exposed/api/v1/personal/$token/csv
- https://youtube.tracking.exposed/api/v1/personal/$token/$paging
- https://youtube.tracking.exposed/api/v1/research/$token
- **new** https://youtube.tracking.exposed/api/v1/personal/$token/related/$paging: return a list of all the related videos

## VideoId related

- https://youtube.tracking.exposed/api/v1/videoId/$videoId/$paging
- https://youtube.tracking.exposed/api/v1/related/$videoId/$paging
- https://youtube.tracking.exposed/api/v1/videoCSV/$videoId/$paging

## Node related

- https://youtube.tracking.exposed/api/v2/statistics/
- https://youtube.tracking.exposed/api/v1/last
- **new** https://youtube.tracking.exposed/api/v1/author/John%20Malecki: return a list of video watched by selecting the author channel

## special

- https://youtube.tracking.exposed/api/v1/htmlId/$id
