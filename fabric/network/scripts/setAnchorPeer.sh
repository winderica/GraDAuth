. scripts/envVar.sh

ORG=$1
CHANNEL_NAME=$2

createAnchorPeerUpdate() {
  peer channel fetch config config_block.pb -o orderer.example.com:7050 -c "$CHANNEL_NAME" --tls --cafile "$ORDERER_CA"
  configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >config.json

  if [ "$ORG" -eq 1 ]; then
    HOST="peer0.org1.example.com"
    PORT=7051
  elif [ "$ORG" -eq 2 ]; then
    HOST="peer0.org2.example.com"
    PORT=9051
  fi

  jq '.channel_group.groups.Application.groups.'"$CORE_PEER_LOCALMSPID"'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' config.json > modified_config.json

  configtxlator proto_encode --input config.json --type common.Config >original_config.pb
  configtxlator proto_encode --input modified_config.json --type common.Config >modified_config.pb
  configtxlator compute_update --channel_id "$CHANNEL_NAME" --original original_config.pb --updated modified_config.pb >config_update.pb
  configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
  echo '{"payload":{"header":{"channel_header":{"channel_id":"'"$CHANNEL_NAME"'", "type":2}},"data":{"config_update":'"$(cat config_update.json)"'}}}' | jq . >config_update_in_envelope.json
  configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >anchors.tx
}

updateAnchorPeer() {
  peer channel update -o orderer.example.com:7050 -c "$CHANNEL_NAME" -f anchors.tx --tls --cafile "$ORDERER_CA"
}

setGlobals "$ORG"
createAnchorPeerUpdate
updateAnchorPeer
