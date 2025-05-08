# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New middleware: `persist()` for localStorage/AsyncStorage sync.
- Added `lucentQuery().invalidate()` method.

### Fixed
- Bug where logger middleware caused double renders in dev mode.

---

## [1.0.2] - 2024-11-20

### Added
- Initial LucentQuery implementation.

### Changed
- Updated internal typings for better DX.

### Fixed
- Typo in `createStore` example in README.

---

## [1.0.0] - 2024-10-12

### Added
- Initial release: `createStore`, middleware support, full TS support.
