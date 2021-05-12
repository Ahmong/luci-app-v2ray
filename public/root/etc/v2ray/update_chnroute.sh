#!/bin/bash

set -o errexit
set -o pipefail

echo "Downloading apinc ipsets..."
curl -4sSkL 'http://ftp.apnic.net/apnic/stats/apnic/delegated-apnic-latest' > /tmp/apnic_ipset.txt
echo "Download finished."

echo "Writing chnroute.txt..."
cat /tmp/apnic_ipset.txt | grep CN | grep ipv4 | awk -F'|' '{printf("%s/%d\n", $4, 32-log($5)/log(2))}' >> /tmp/chnroute.ipset
mv chnroute.txt chnroute.txt.old
mv /tmp/chnroute.ipset chnroute.txt
echo "Finished."

echo "Writing chnroute6.txt..."
cat /tmp/apnic_ipset.txt | grep CN | grep ipv6 | awk -F'|' '{printf("%s/%d\n", $4, 32-log($5)/log(2))}' >> /tmp/chnroute6.ipset
mv chnroute6.txt chnroute6.txt.old
mv /tmp/chnroute6.ipset chnroute6.txt
echo "Finished."
