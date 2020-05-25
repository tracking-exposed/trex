#!/bin/sh
for x in `seq 0 120`; do
	i=$(($x*10));
	echo "script looping on $x/120 $i";
	DEBUG=yttrex:parserv,*:*:error node bin/parserv2.js --minutesago 90000 --filter internal.json --skip $i --stop 10;
done
echo "completed configured loop"