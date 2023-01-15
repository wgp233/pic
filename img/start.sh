export PORT=${PORT-8080}
export UUID=${UUID-1eb6e917774b4a84aff6b058577c60a5}
export PATH_vless=${PATH_vless-/vless/$UUID}

echo '
 {
    "log": {"loglevel": "warning"},
    "inbounds": [
        {
            "port": "'$PORT'",
            "listen": "127.0.0.1",
            "protocol": "vless",
            "settings": {
                "clients": [
                    {
                        "id": "'$UUID'"
                    }
                ],
                "decryption": "none"
            },
            "streamSettings": {
                "network": "ws",
                "security": "none",
                "wsSettings": {
                    "path": "'$PATH_vless'"
                }
            }
        }
    ],
    "outbounds": [
        {
            "protocol": "freedom"
        }
    ]
}
' > conf.json
chmod +x ./web
./web -config=conf.json