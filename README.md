# GraDAuth

GradAuth Reinforces Anonymity in Decentralized Authorization

## Folder structure

```
./
├── app/
│   ├── backend/
│   │   ├── src/
│   │   └── ...
│   └── frontend/
│       ├── src/
│       └── ...
├── fabric/
│   ├── chaincode/
│   │   ├── src/
│   │   └── ...
│   ├── electron/
│   │   ├── src/
│   │   └── ...
│   └── frontend/
│       ├── src/
│       └── ...
└── lib/
    ├── mcl
    └── ...

```

## Notes

### Download binaries

directory: `fabric/network/`

download from here: <https://github.com/hyperledger/fabric/releases>.

only `configtxgen`, `fabric-ca-client`, `osnadmin` and `peer` are needed.

### Install chaincode dependencies

directory: `fabric/chaincode/`

```shell
yarn --ignore-engines
```

### Install GraDAuth electron dependencies

directory: `fabric/electron/`

```shell
yarn --ignore-engines
```

### Install GraDAuth frontend dependencies

directory: `fabric/frontend/`

```shell
yarn
```

### Install App frontend dependencies

directory: `app/frontend/`

```shell
yarn
```

### Install App backend dependencies

directory: `app/backend/`

```shell
yarn
```

### Start network

directory: `fabric/network/`

```shell
./network.sh up
```

### Create channel

directory: `fabric/network/`

```shell
./network.sh createChannel
```

### Deploy/Upgrade chaincode

directory: `fabric/network/`

```shell
./network.sh deployCC -n GraDAuth
```

### Run GraDAuth electron

directory: `fabric/electron/`

```shell
yarn start
```

### Run GraDAuth frontend

directory: `fabric/frontend/`

```shell
yarn start
```

### Run App backend

directory: `app/backend/`

```shell
yarn start
```

URL: `http://127.0.0.1:4001`

### Run App frontend

directory: `app/frontend/`

```shell
yarn start
```

URL: `http://127.0.0.1:3001`
