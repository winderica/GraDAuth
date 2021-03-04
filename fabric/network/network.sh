#!/bin/bash

export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/config

function clearContainers() {
  docker rm -f $(docker ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null || true
  docker rm -f $(docker ps -aq --filter name='dev-peer*') 2>/dev/null || true
}

function removeUnwantedImages() {
  docker image rm -f $(docker images -aq --filter reference='dev-peer*') 2>/dev/null || true
}

function createOrgs() {
  if [ -d "organizations/peerOrganizations" ]; then
    rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
  fi
  docker-compose -f "$COMPOSE_FILE_CA" up -d 2>&1
  . organizations/fabric-ca/registerEnroll.sh
  while :
    do
      if [ ! -f "organizations/fabric-ca/org1/tls-cert.pem" ]; then
        sleep 1
      else
        break
      fi
    done
  createOrg1
  createOrg2
  createOrderer
  ./organizations/ccp-generate.sh
}

function networkUp() {
  if [ ! -d "organizations/peerOrganizations" ]; then
    createOrgs
  fi
  docker-compose -f "${COMPOSE_FILE_BASE}" -f "${COMPOSE_FILE_COUCH}" up -d
}

function createChannel() {
  if [ ! -d "organizations/peerOrganizations" ]; then
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
    clearContainers
    removeUnwantedImages
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf system-genesis-block/*.block organizations/peerOrganizations organizations/ordererOrganizations'
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/org1/msp organizations/fabric-ca/org1/tls-cert.pem organizations/fabric-ca/org1/ca-cert.pem organizations/fabric-ca/org1/IssuerPublicKey organizations/fabric-ca/org1/IssuerRevocationPublicKey organizations/fabric-ca/org1/fabric-ca-server.db'
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/org2/msp organizations/fabric-ca/org2/tls-cert.pem organizations/fabric-ca/org2/ca-cert.pem organizations/fabric-ca/org2/IssuerPublicKey organizations/fabric-ca/org2/IssuerRevocationPublicKey organizations/fabric-ca/org2/fabric-ca-server.db'
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/ordererOrg/msp organizations/fabric-ca/ordererOrg/tls-cert.pem organizations/fabric-ca/ordererOrg/ca-cert.pem organizations/fabric-ca/ordererOrg/IssuerPublicKey organizations/fabric-ca/ordererOrg/IssuerRevocationPublicKey organizations/fabric-ca/ordererOrg/fabric-ca-server.db'
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf channel-artifacts *.tar.gz'
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

if [ "${MODE}" == "up" ]; then
  networkUp
elif [ "${MODE}" == "createChannel" ]; then
  createChannel
elif [ "${MODE}" == "deployCC" ]; then
  deployCC
elif [ "${MODE}" == "down" ]; then
  networkDown
elif [ "${MODE}" == "restart" ]; then
  networkDown
  networkUp
else
  exit 1
fi
