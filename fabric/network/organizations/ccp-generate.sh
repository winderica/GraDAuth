#!/bin/bash

function json_ccp {
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEM}#`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' "$4"`#" \
        organizations/ccp-template.json
}

ORG=1
P0PORT=7051
CAPORT=7054
PEM=organizations/fabric-ca/org1/ca-cert.pem

json_ccp $ORG $P0PORT $CAPORT $PEM > ../ca/assets/connection-org1.json

ORG=2
P0PORT=9051
CAPORT=8054
PEM=organizations/fabric-ca/org2/ca-cert.pem

json_ccp $ORG $P0PORT $CAPORT $PEM > ../ca/assets/connection-org2.json
