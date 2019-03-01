#! /bin/bash

LOG=/tmp/ddproxy.log
PID=/tmp/ddproxy.pid
APP=server/index.js
NODE=node
SCRIPT=`readlink -f $0`
DIR=`dirname $SCRIPT`

startme() {
    echo -n "Starting ddproxy.."
    if [ -f $PID ]
    then
        echo ". Already started. PID: [$( cat $PID )]"
    else
        cd $DIR
        $NODE $DIR/$APP >> $LOG 2>&1 &
        echo $! > $PID
        echo ". Done. PID: [$( cat $PID )]"
    fi
}

stopme() {
    echo -n "Stopping ddproxy.."
    if [ -f $PID ]
    then
        kill $( cat $PID )
        rm $PID
        echo ". Done."
    else
        echo ". No pid file. Already stopped?"
    fi
}

mystatus() {
    echo -n "Status of ddproxy: "
    if [ -f $PID ]
    then
        echo "Pid file $PID [$( cat $PID )]"
        echo
        ps -ef | grep -v grep | grep $( cat $PID )
    else
        echo "No Pid file"
    fi
}

case "$1" in 
    start)   startme ;;
    stop)    stopme ;;
    restart) stopme; startme ;;
    status)  mystatus ;;
    *) echo "Usage: $0 { start | stop | restart | status }" >&2
       exit 1
       ;;
esac