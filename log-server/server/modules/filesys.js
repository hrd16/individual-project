const fs = require('fs');

module.exports = function (handler) {
    let streams = new Map();

    function getFileForNode(node, type) {
        let key = `${node}-${type}`;
        if (streams.has(key)) {
            return streams.get(key);
        } else {
            var file = fs.createWriteStream(`/var/simul/${key}.txt`, {flags:'a'});
            streams.set(key, file);
            return file;
        }
    }

    handler.subscribe('app', msgs => { 
        msgs.forEach(msg => {
            let file = getFileForNode(msg.node, 'node');
            file.write(JSON.stringify(msg) + "\n");
        });
    });

    handler.subscribe('proxy', msgs => { 
        msgs.forEach(msg => {
            let file = getFileForNode(msg.to, 'messages');
            file.write(JSON.stringify(msg) + "\n");
        });
    });
};