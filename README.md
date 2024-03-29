# setup-swig

This actions step downloads and installs a version of SWIG.

## Usage

For the latest version on the main branch:

```yaml
name: "my-project"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mmomtchev/setup-swig@v1

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
      - uses: mmomtchev/setup-swig@v1
        with:
          branch: jse

      - name: Verify
        run: swig -version
```

Specific version:

```yaml
name: "my-project"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mmomtchev/setup-swig@v1
        with:
          version: v4.1.0

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
```

See [action.yml](action.yml)
