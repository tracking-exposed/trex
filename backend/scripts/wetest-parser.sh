

for x in `seq 0 520`; 
	do
	i=$(($x*20));
	echo "script looping on $x/520 $i";
	set DEBUG="*:*:error"
	export DEBUG="*:*:error"
	node bin/parserv2.js --minutesago 87000 --repeat 1 --filter missingWords.json --skip $i --stop 20;
done

