const ami = require('asterisk-manager')('5038', '192.168.1.5', 'admin', 'gustavo2003', true);

ami.keepConnected();

var tempSipArr = [];
var tempSipAllArr = [];
var finalSipNotOkArr = [];
var finalSipAllArr = [];
var DNDArr = [];

function insertDNDStatus() {
    ami.action({
        'action': 'Command',
        'command': 'database show'
    }, function (err, evt) {
        DNDArr = evt.content.match(/\/DND\/\d+/g);
        finalSipAllArr.map(peer => {
            DNDArr.map(dnd => {
                let extensionNumber = dnd.match(/\d+/g)[0];
                if (peer.objectname === extensionNumber) {
                    peer.dnd = true;
                    if (peer.name !== undefined) {
                        ami.action({
                            'action': 'SIPshowpeer',
                            'peer': peer.objectname
                        }, function (err, response) {
                            peer.name = response.callerid
                        })
                    }
                } else {
                    peer.dnd = false;
                }
            });
        })
    })
}

function filterExtensions(evt) {
    if (evt.event === 'PeerEntry') {
        tempSipAllArr.push(evt);
        if (!evt.status.includes('OK')) {
            tempSipArr.push(evt);
        }
    }
    if (evt.event === 'PeerlistComplete') {
        finalSipNotOkArr = tempSipArr;
        finalSipAllArr = tempSipAllArr;
        tempSipArr = [];
        tempSipAllArr = [];
        finalSipNotOkArr.map(peer => {
            ami.action({
                'action': 'SIPshowpeer',
                'peer': peer.objectname
            }, function (err, response) {
                peer.name = response.callerid
            })
        })
    }
}

setInterval(() => {
    ami.action({
        'action': 'SIPpeers'
    });
    insertDNDStatus();
    console.log(`Não registrados: ${finalSipNotOkArr.length} | Total: ${finalSipAllArr.length}`);
}, 5000);

ami.on('managerevent', function (evt, err) {
    filterExtensions(evt);
});

