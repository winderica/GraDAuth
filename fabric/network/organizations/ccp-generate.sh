#!/bin/bash

ORG1_PEM=organizations/fabric-ca/org1/ca-cert.pem
ORG2_PEM=organizations/fabric-ca/org2/ca-cert.pem
ORDERER_PEM=organizations/fabric-ca/ordererOrg/ca-cert.pem

function json_ccp() {
  sed -e "s/\${ORG}/$1/" \
    -e "s#\${ORG1_PEM}#$(sed -z 's/\n/\\\\n/g' "$ORG1_PEM")#" \
    -e "s#\${ORG2_PEM}#$(sed -z 's/\n/\\\\n/g' "$ORG2_PEM")#" \
    -e "s#\${ORDERER_PEM}#$(sed -z 's/\n/\\\\n/g' "$ORDERER_PEM")#" \
    organizations/ccp-template.json
}

json_ccp 1 >../ca/assets/connection-org1.json
json_ccp 2 >../ca/assets/connection-org2.json
