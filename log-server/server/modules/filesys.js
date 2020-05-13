const fs = require('fs');

module.exports = function (handler) {
    let streams = new Map();

    function getFileForNode(node) {
        if (streams.has(node)) {
            return streams.get(node);
        } else {
            var file = fs.createWriteStream(`/var/simul/${node}.txt`, {flags:'a'});
            streams.set(node, file);
            return file;
        }
    }

    handler.subscribe('app', msgs => { 
        msgs.forEach(msg => {
            let file = getFileForNode(msg.node);
            file.write(JSON.stringify(msg) + "\n");
        });
    });
};