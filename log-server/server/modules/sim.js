const express = require('express');

module.exports = function (sim_config) {
    const router = express.Router();

    router.get(`/config`, function (req, res) {
        res.send(JSON.stringify(sim_config));
    });

    return router;
};