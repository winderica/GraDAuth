. scripts/envVar.sh

CHANNEL_NAME="$1"
DELAY="1"
MAX_RETRY="10"

createChannelGenesisBlock() {
	configtxgen -profile TwoOrgsApplicationGenesis -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME
}

createChannel() {
	setGlobals 1
	local rc=1
	local COUNTER=1
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
		sleep $DELAY
		osnadmin channel join --channelID $CHANNEL_NAME --config-block ./channel-artifacts/${CHANNEL_NAME}.block -o localhost:7053 --ca-file "$ORDERER_CA" --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY"
		res=$?
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
}

joinChannel() {
  setGlobals $1
	local rc=1
	local COUNTER=1
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    res=$?
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
}

setAnchorPeer() {
  docker exec cli bash ./scripts/setAnchorPeer.sh $1 $CHANNEL_NAME
}

createChannelGenesisBlock
createChannel
joinChannel 1
joinChannel 2
setAnchorPeer 1
setAnchorPeer 2
