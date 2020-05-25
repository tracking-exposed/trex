#!/bin/sh
for x in `seq 0 120`; do
	i=$(($x*10));
	echo "script looping on $x/120 $i";
	DEBUG=yttrex:parserv,*:*:error node bin/parserv2.js --minutesago 87000 --repeat 1 --filter internal.json --skip $i --stop 10;
done