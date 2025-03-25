# setup-swig

This actions step downloads and installs a version of SWIG.

At the moment it supports only Linux runners.

You can check the [`magickwand.js` workflows](https://github.com/mmomtchev/magickwand.js/tree/main/.github/workflows) for an example of a complex project that uses it.

## Usage

For the latest version on the main branch:

```yaml
name: "my-project"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mmomtchev/setup-swig@v4

      - name: Verify
        run: swig -version
```

For SWIG JSE:

```yaml
name: "my-project"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mmomtchev/setup-swig@v4
        with:
          branch: jse

      - name: Verify
        run: swig -version
```

Specific version with authentication - use authentication if you get API rate errors:

```yaml
name: "my-project"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mmomtchev/setup-swig@v4
        with:
          version: v4.1.0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Verify
        run: swig -version
```



## Options

```yaml
  version:
    description: 'Version to install'
    default: 'latest'
  branch:
    description: 'Branch to install'
    default: 'main'
  cache:
    description: 'Cache builds'
    default: true
  token:
    description: 'Optional authentication token'
    default: ''
```

See [action.yml](action.yml)
