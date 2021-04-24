export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=$PWD/organizations/orderer/msp/tlscacerts/tlsca.example.com-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=$PWD/organizations/orderer/orderer/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=$PWD/organizations/orderer/orderer/tls/server.key

setGlobals() {
  local USING_ORG=$1
  if [ "$USING_ORG" -eq 1 ]; then
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/org1/peer0/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/org1/admin/msp
    export CORE_PEER_ADDRESS=localhost:7051
  elif [ "$USING_ORG" -eq 2 ]; then
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/org2/peer0/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/org2/admin/msp
    export CORE_PEER_ADDRESS=localhost:9051
  fi
}
