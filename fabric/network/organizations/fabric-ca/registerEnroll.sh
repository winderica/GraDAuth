export FABRIC_CA_CLIENT_LOGLEVEL=error

function createOrg1() {
  export FABRIC_CA_CLIENT_HOME=$PWD/organizations/org1
  export FABRIC_CA_CLIENT_TLS_CERTFILES=$PWD/organizations/fabric-ca/org1/tls-cert.pem
  export FABRIC_CA_CLIENT_CANAME=ca-org1

  mkdir -p "$FABRIC_CA_CLIENT_HOME"

  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: orderer' >"$FABRIC_CA_CLIENT_HOME/msp/config.yaml"

  fabric-ca-client register --id.name peer0 --id.secret peer0pw --id.type peer

  fabric-ca-client register --id.name org1admin --id.secret org1adminpw --id.type admin

  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 -M "$FABRIC_CA_CLIENT_HOME/peer0/msp" --csr.hosts peer0.org1.example.com

  cp "$FABRIC_CA_CLIENT_HOME/msp/config.yaml" "$FABRIC_CA_CLIENT_HOME/peer0/msp/config.yaml"

  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 -M "$FABRIC_CA_CLIENT_HOME/peer0/tls" --enrollment.profile tls --csr.hosts peer0.org1.example.com --csr.hosts localhost

  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/peer0/tls/ca.crt"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/signcerts/"* "$FABRIC_CA_CLIENT_HOME/peer0/tls/server.crt"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/keystore/"* "$FABRIC_CA_CLIENT_HOME/peer0/tls/server.key"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/msp/tlscacerts"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/msp/tlscacerts/ca.crt"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/tlsca"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/tlsca/tlsca.org1.example.com-cert.pem"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/ca"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/msp/cacerts/"* "$FABRIC_CA_CLIENT_HOME/ca/ca.org1.example.com-cert.pem"

  fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 -M "$FABRIC_CA_CLIENT_HOME/admin/msp"

  cp "$FABRIC_CA_CLIENT_HOME/msp/config.yaml" "$FABRIC_CA_CLIENT_HOME/admin/msp/config.yaml"
}

function createOrg2() {
  export FABRIC_CA_CLIENT_HOME=$PWD/organizations/org2
  export FABRIC_CA_CLIENT_TLS_CERTFILES=$PWD/organizations/fabric-ca/org2/tls-cert.pem
  export FABRIC_CA_CLIENT_CANAME=ca-org2

  mkdir -p "$FABRIC_CA_CLIENT_HOME"

  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: orderer' >"$FABRIC_CA_CLIENT_HOME/msp/config.yaml"

  fabric-ca-client register --id.name peer0 --id.secret peer0pw --id.type peer

  fabric-ca-client register --id.name org2admin --id.secret org2adminpw --id.type admin

  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 -M "$FABRIC_CA_CLIENT_HOME/peer0/msp" --csr.hosts peer0.org2.example.com

  cp "$FABRIC_CA_CLIENT_HOME/msp/config.yaml" "$FABRIC_CA_CLIENT_HOME/peer0/msp/config.yaml"

  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 -M "$FABRIC_CA_CLIENT_HOME/peer0/tls" --enrollment.profile tls --csr.hosts peer0.org2.example.com --csr.hosts localhost

  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/peer0/tls/ca.crt"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/signcerts/"* "$FABRIC_CA_CLIENT_HOME/peer0/tls/server.crt"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/keystore/"* "$FABRIC_CA_CLIENT_HOME/peer0/tls/server.key"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/msp/tlscacerts"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/msp/tlscacerts/ca.crt"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/tlsca"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/tlsca/tlsca.org2.example.com-cert.pem"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/ca"
  cp "$FABRIC_CA_CLIENT_HOME/peer0/msp/cacerts/"* "$FABRIC_CA_CLIENT_HOME/ca/ca.org2.example.com-cert.pem"

  fabric-ca-client enroll -u https://org2admin:org2adminpw@localhost:8054 -M "$FABRIC_CA_CLIENT_HOME/admin/msp"

  cp "$FABRIC_CA_CLIENT_HOME/msp/config.yaml" "$FABRIC_CA_CLIENT_HOME/admin/msp/config.yaml"
}

function createOrderer() {
  export FABRIC_CA_CLIENT_HOME=$PWD/organizations/orderer
  export FABRIC_CA_CLIENT_TLS_CERTFILES=$PWD/organizations/fabric-ca/ordererOrg/tls-cert.pem
  export FABRIC_CA_CLIENT_CANAME=ca-orderer

  mkdir -p "$FABRIC_CA_CLIENT_HOME"

  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' >"$FABRIC_CA_CLIENT_HOME/msp/config.yaml"

  fabric-ca-client register --id.name orderer --id.secret ordererpw --id.type orderer

  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 -M "$FABRIC_CA_CLIENT_HOME/orderer/msp" --csr.hosts orderer.example.com --csr.hosts localhost

  cp "$FABRIC_CA_CLIENT_HOME/msp/config.yaml" "$FABRIC_CA_CLIENT_HOME/orderer/msp/config.yaml"

  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 -M "$FABRIC_CA_CLIENT_HOME/orderer/tls" --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost

  cp "$FABRIC_CA_CLIENT_HOME/orderer/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/orderer/tls/ca.crt"
  cp "$FABRIC_CA_CLIENT_HOME/orderer/tls/signcerts/"* "$FABRIC_CA_CLIENT_HOME/orderer/tls/server.crt"
  cp "$FABRIC_CA_CLIENT_HOME/orderer/tls/keystore/"* "$FABRIC_CA_CLIENT_HOME/orderer/tls/server.key"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/orderer/msp/tlscacerts"
  cp "$FABRIC_CA_CLIENT_HOME/orderer/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/orderer/msp/tlscacerts/tlsca.example.com-cert.pem"

  mkdir -p "$FABRIC_CA_CLIENT_HOME/msp/tlscacerts"
  cp "$FABRIC_CA_CLIENT_HOME/orderer/tls/tlscacerts/"* "$FABRIC_CA_CLIENT_HOME/msp/tlscacerts/tlsca.example.com-cert.pem"
}
