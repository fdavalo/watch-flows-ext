tcpdump -i any -n -n "tcp[tcpflags] & (tcp-syn) !=0 and tcp[tcpflags] & (tcp-ack) =0" | node index.js
