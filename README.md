# Armoury FiveM Framework

## Packages

The repository publishes three npm workspace packages:

- `@armoury/fivem-framework-common` for shared models, decorators, and utilities.
- `@armoury/fivem-framework-client` for FiveM client APIs.
- `@armoury/fivem-framework-server` for FiveM server APIs and MikroORM integration.

Install only the package for the runtime you are targeting:

```sh
npm install @armoury/fivem-framework-client
npm install @armoury/fivem-framework-server
```

Build all packages from the repository root with `npm run build`.

## License

This package is licensed under the terms of the Apache License 2.0 with The Commons Clause.
See [LICENSE](LICENSE) for more information.