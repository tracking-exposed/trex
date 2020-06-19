The format is based on [Keep a Changelog](http://keepachangelog.com/) and this
project adheres to [Semantic Versioning](http://semver.org/).

## [1.4.2] - 2020-06-20
### Fixed
- home parsing has language and thumbnail detection
- completed version 7 of wetest1

## [1.4.1] - 2020-06-17
### Added
- in metadata DB, numeric likes and thumbnails.
### Fixed
- produced version 6 of wetest1 dataset extractor

## [1.4.0] - 2020-05-08
### Added
- Improved longlabel parsing
- Extended events api to get labels in real-time

## Removed
- Dead code and mongo2

## [1.3.0] - 2020-03-01
### Added
- Home parsing and extraction
- Wetest#1 general testing
- Parsing of localized datetime 

## [1.2.1] - 2019-10-20
### Added
- Events version 2, using await/async and moving saving to html

## [1.2] - 2019-10-08
### Added
- Released new personal page
- Released first result in page /results
- Migrated to HUGO and new branding
### Fixed
- Removed any comparison-related code (sequences etc)

## [1.1.5] - 2018-11-07
### Fixed
- Text
- Bug when reporting about a live video

## [1.1.0] - 2018-10-23
### Added
- Implemented divergency, results and personal APIs
- Updated DB format with `commitments` and `sequences`
- Implemented tool to link videos to the same testId

## [1.0.2] - 2018-09-18
### Fixed
- Made a barely useful personal page
- Stabilized parser
- Changed API to access with publicKey

## [1.0.1] - 2018-09-15
### Added
- Skeleton of personal page
### Fixed
- Supporter info get updated at every new submission

## [1.0.0] - 2018-08-26
### Added
- Create first release of the server
- Tested only the API /events and the basic parsing mechanism
