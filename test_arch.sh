tsc

node dist/main-inter.js -s 3000 -n I3 &
sleep 1
node dist/main-inter.js -s 3001 -p 3000 -n I2 &
node dist/main-inter.js -s 3002 -p 3001 -n I1 &
sleep 1
node dist/main-sub.js -p 3001 -t a1 -n A1 &
node dist/main-sub.js -p 3001 -t a2 -n A2 &
node dist/main-sub.js -p 3000 -t a3 -t a1 -n A3 &
sleep 1
node dist/main-pub.js -p 3000 -t a3 -d world -n P2 &
node dist/main-pub.js -p 3002 -t a1 -d hello -n P1

sleep 2
pkill node
