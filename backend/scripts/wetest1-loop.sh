#!/bin/sh

if [ ! -n "$1" ]; then
	echo "please specify the filter file as second argument"
	exit
fi

NUMBEROF=10;
if [ -n "$2" ]; then
	NUMBEROF=$2
	echo "overriding the 10 default number of iteration with $NUMBEROF"
fi

for x in `seq 0 $NUMBEROF`; do
	i=$(($x*10));
	we1=$((`date --date="2020-03-24 23:59:00" +%s` / 60));
	nao=$((`date +%s` / 60));
	minutesago=$(($nao - $we1));

	echo "script looping on $x/$NUMBEROF, --minutesago $minutesago";
	DEBUG=yttrex:parserv,*:*:error node bin/parserv2.js --minutesago $minutesago --filter "$1" --skip $i --stop 10;
done
echo "completed configured loop"
