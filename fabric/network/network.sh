#!/bin/bash

export PATH=$PWD/bin:$PATH
export FABRIC_CFG_PATH=$PWD/config

function createOrgs() {
  if [ -d "organizations/orderer" ]; then
    rm -Rf organizations/or*
  fi
  docker-compose -f "$COMPOSE_FILE_CA" up -d
  while [ ! -f "organizations/fabric-ca/org1/tls-cert.pem" ]; do
    sleep 1
  done
  . organizations/fabric-ca/registerEnroll.sh
  createOrg1
  createOrg2
  createOrderer
  ./organizations/ccp-generate.sh
}

function networkUp() {
  if [ ! -d "organizations/orderer" ]; then
    createOrgs
  fi
  docker-compose -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_COUCH" up -d
}

function createChannel() {
  if [ ! -d "organizations/orderer" ]; then
    networkUp
  fi
  scripts/createChannel.sh "$CHANNEL_NAME"
}

function deployCC() {
  scripts/deployCC.sh "$CHANNEL_NAME" "$CHAINCODE_NAME"
}

function networkDown() {
  docker-compose -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_COUCH" -f "$COMPOSE_FILE_CA" down --volumes --remove-orphans
  if [ "$MODE" != "restart" ]; then
    docker rm -f "$(docker ps -aq --filter label=service=hyperledger-fabric)" 2>/dev/null || true
    docker rm -f "$(docker ps -aq --filter name='dev-peer*')" 2>/dev/null || true
    docker image rm -f "$(docker images -aq --filter reference='dev-peer*')" 2>/dev/null || true
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/**/*.pem organizations/or*'
    rm -rf channel-artifacts ./*.tar.gz ../../*/*/wallet/*.id ../../*/*/assets/connection*.json
  fi
}

CHANNEL_NAME="channel"
CHAINCODE_NAME="chaincode"
COMPOSE_FILE_BASE=docker/docker-compose-test-net.yaml
COMPOSE_FILE_COUCH=docker/docker-compose-couch.yaml
COMPOSE_FILE_CA=docker/docker-compose-ca.yaml

if [[ $# -lt 1 ]]; then
  exit 0
else
  MODE=$1
  shift
fi

if [[ $# -ge 1 ]]; then
  key="$1"
  if [[ "$key" == "createChannel" ]]; then
    export MODE="createChannel"
    shift
  fi
fi

while [[ $# -ge 1 ]]; do
  key="$1"
  case $key in
  -c)
    CHANNEL_NAME="$2"
    shift
    ;;
  -n)
    CHAINCODE_NAME="$2"
    shift
    ;;
  esac
  shift
done

if [ "$MODE" == "up" ]; then
  networkUp
elif [ "$MODE" == "createChannel" ]; then
  createChannel
elif [ "$MODE" == "deployCC" ]; then
  deployCC
elif [ "$MODE" == "down" ]; then
  networkDown
elif [ "$MODE" == "restart" ]; then
  networkDown
  networkUp
else
  exit 1
fi
