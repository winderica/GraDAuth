. scripts/envVar.sh

CHANNEL_NAME="$1"
CHAINCODE_NAME="$2"

packageChaincode() {
  setGlobals "$1"
  cd ../chaincode || exit
  yarn build
  cd - >/dev/null || exit
  peer lifecycle chaincode package "$CHAINCODE_NAME".tar.gz --path "../chaincode/dist/" --lang node --label "$CHAINCODE_NAME"_"$VERSION"
}

installChaincode() {
  setGlobals "$1"
  peer lifecycle chaincode install "$CHAINCODE_NAME".tar.gz
}

approveForMyOrg() {
  setGlobals "$1"
  PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "$CHAINCODE_NAME"_"$VERSION" | awk '{print $3}' | sed 's/.$//')
  peer lifecycle chaincode approveformyorg -o localhost:7050 --tls "$CORE_PEER_TLS_ENABLED" --cafile "$ORDERER_CA" --channelID "$CHANNEL_NAME" --name "$CHAINCODE_NAME" --version "$VERSION" --init-required --package-id "$PACKAGE_ID" --sequence "$VERSION"
}

checkCommitReadiness() {
  setGlobals "$1"
  peer lifecycle chaincode checkcommitreadiness --channelID "$CHANNEL_NAME" --name "$CHAINCODE_NAME" --version "$VERSION" --sequence "$VERSION" --init-required
}

commitChaincodeDefinition() {
  PEER_CONN_PARMS=""
  while [ "$#" -gt 0 ]; do
    setGlobals "$1"
    PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $CORE_PEER_ADDRESS --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE"
    shift
  done
  peer lifecycle chaincode commit -o localhost:7050 --tls "$CORE_PEER_TLS_ENABLED" --cafile "$ORDERER_CA" --channelID "$CHANNEL_NAME" --name "$CHAINCODE_NAME" $PEER_CONN_PARMS --version "$VERSION" --sequence "$VERSION" --init-required
}

getVersion() {
  setGlobals "$1"
  VERSION=$(($(peer lifecycle chaincode querycommitted --channelID "$CHANNEL_NAME" --name "$CHAINCODE_NAME" 2>&1 | grep -oP "Version: \K(\d+)") + 1))
}

queryCommitted() {
  setGlobals "$1"
  peer lifecycle chaincode querycommitted --channelID "$CHANNEL_NAME" --name "$CHAINCODE_NAME"
}

chaincodeInvokeInit() {
  PEER_CONN_PARMS=""
  while [ "$#" -gt 0 ]; do
    setGlobals "$1"
    PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $CORE_PEER_ADDRESS --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE"
    shift
  done
  peer chaincode invoke -o localhost:7050 --tls "$CORE_PEER_TLS_ENABLED" --cafile "$ORDERER_CA" -C "$CHANNEL_NAME" -n "$CHAINCODE_NAME" $PEER_CONN_PARMS --isInit -c '{"function":"init","Args":["aaaa", "bbbb"]}'
}

getVersion 1
packageChaincode 1
installChaincode 1
installChaincode 2
approveForMyOrg 1
approveForMyOrg 2
checkCommitReadiness 1
checkCommitReadiness 2
commitChaincodeDefinition 1 2
queryCommitted 1
queryCommitted 2
chaincodeInvokeInit 1 2
