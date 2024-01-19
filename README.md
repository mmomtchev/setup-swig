# setup-swig

This actions step downloads and installs a version of SWIG.

## Usage

For the latest version on the main branch:

```yaml
name: "my-projec"
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
name: "my-projec"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mmomtchev/setup-swig@v1
        branch: jse

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
```

See [action.yml](action.yml)
