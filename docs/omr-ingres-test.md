# Test local https over ingress

## Local

curl -Iv https://omr.gongtham.net
* Host omr.gongtham.net:443 was resolved.
* IPv6: ::
* IPv4: 10.10.26.104
*   Trying 10.10.26.104:443...
* Connected to omr.gongtham.net (10.10.26.104) port 443
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
*  CAfile: /etc/ssl/certs/ca-certificates.crt
*  CApath: /etc/ssl/certs
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / RSASSA-PSS
* ALPN: server accepted h2
* Server certificate:
*  subject: CN=omr.gongtham.net
*  start date: Dec 16 01:39:01 2025 GMT
*  expire date: Mar 16 01:39:00 2026 GMT
*  subjectAltName: host "omr.gongtham.net" matched cert's "omr.gongtham.net"
*  issuer: C=US; O=Let's Encrypt; CN=R12
*  SSL certificate verify ok.
*   Certificate level 0: Public key type RSA (2048/112 Bits/secBits), signed using sha256WithRSAEncryption
*   Certificate level 1: Public key type RSA (2048/112 Bits/secBits), signed using sha256WithRSAEncryption
*   Certificate level 2: Public key type RSA (4096/152 Bits/secBits), signed using sha256WithRSAEncryption
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
* old SSL session ID is stale, removing
* using HTTP/2
* [HTTP/2] [1] OPENED stream for https://omr.gongtham.net/
* [HTTP/2] [1] [:method: HEAD]
* [HTTP/2] [1] [:scheme: https]
* [HTTP/2] [1] [:authority: omr.gongtham.net]
* [HTTP/2] [1] [:path: /]
* [HTTP/2] [1] [user-agent: curl/8.5.0]
* [HTTP/2] [1] [accept: */*]
> HEAD / HTTP/2
> Host: omr.gongtham.net
> User-Agent: curl/8.5.0
> Accept: */*
> 
< HTTP/2 400 
HTTP/2 400 
< server: nginx/1.24.0
server: nginx/1.24.0
< date: Tue, 16 Dec 2025 03:48:29 GMT
date: Tue, 16 Dec 2025 03:48:29 GMT
< content-type: text/html
content-type: text/html
< content-length: 157
content-length: 157
< strict-transport-security: max-age=63072000
strict-transport-security: max-age=63072000

< 
* Connection #0 to host omr.gongtham.net left intact

## Public
