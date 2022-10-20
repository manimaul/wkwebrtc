# [CoTurn](https://github.com/coturn/coturn) on Debian 11 / Linode


### Setup Manually Via SSH
```shell
apt update && apt upgrade -y 
```

Point dns to `turn.willkamp.com`
A -> 45.79.65.185
AAAA -> 2600:3c01::f03c:93ff:fe15:2181

### Install Coturn
```shell
apt install -y coturn
systemctl stop coturn
```

### Configure Coturn

In order to enable the TURN server, open the file /etc/default/coturn and remove the # in front of TURNSERVER_ENABLED=1.

The configuration file is located at /etc/turnserver.conf. First we move the original version of this file using:

```shell 
mv /etc/turnserver.conf /etc/turnserver.conf.orig
```

Then we open/create /etc/turnserver.conf in an editor of our choice and paste the following configuration:

```
listening-port=3478
tls-listening-port=5349

fingerprint
lt-cred-mech

use-auth-secret
static-auth-secret=replace-this-secret

realm=turn.willkamp.com

total-quota=100
stale-nonce=600

cert=/etc/letsencrypt/live/turn.willkamp.com/cert.pem
pkey=/etc/letsencrypt/live/turn.willkamp.com/privkey.pem
cipher-list="ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384"

no-sslv3
no-tlsv1
no-tlsv1_1
#no-tlsv1_2

dh2066

no-stdout-log
log-file=/var/tmp/turn.log
#log-file=/dev/null

no-loopback-peers
no-multicast-peers

proc-user=turnserver
proc-group=turnserver

```

`sed -i "s/replace-this-secret/$(openssl rand -hex 32)/" /etc/turnserver.conf`


### Install certbot and get certs

```shell
apt install -y certbot
certbot certonly --standalone --rsa-key-size 4096 -m me@willkamp.com -d turn.willkamp.com 
```


### Authentication

```shell
#https://www.ietf.org/proceedings/87/slides/slides-87-behave-10.pdf
u=$((`date +%s` + 3600)):test
p=$(echo -n $u | openssl dgst -hmac $TURN_KEY -sha1 -binary | base64)
echo -e "username: $u\npassword: $p"
```
