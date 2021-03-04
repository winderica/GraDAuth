. scripts/envVar.sh
. scripts/configUpdate.sh

ORG=$1
CHANNEL_NAME=$2

createAnchorPeerUpdate() {
  fetchChannelConfig "$ORG" "$CHANNEL_NAME" "${CORE_PEER_LOCALMSPID}"config.json

  if [ "$ORG" -eq 1 ]; then
    HOST="peer0.org1.example.com"
    PORT=7051
  elif [ "$ORG" -eq 2 ]; then
    HOST="peer0.org2.example.com"
    PORT=9051
  fi

  jq '.channel_group.groups.Application.groups.'"${CORE_PEER_LOCALMSPID}"'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' "${CORE_PEER_LOCALMSPID}"config.json > "${CORE_PEER_LOCALMSPID}"modified_config.json

  createConfigUpdate "${CHANNEL_NAME}" "${CORE_PEER_LOCALMSPID}"config.json "${CORE_PEER_LOCALMSPID}"modified_config.json "${CORE_PEER_LOCALMSPID}"anchors.tx
}

updateAnchorPeer() {
  peer channel update -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com -c "$CHANNEL_NAME" -f "${CORE_PEER_LOCALMSPID}"anchors.tx --tls --cafile "$ORDERER_CA"
}

setGlobalsCLI $ORG
createAnchorPeerUpdate
updateAnchorPeer
