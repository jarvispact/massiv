const { sleep } = require('../helpers');

const specs = {
    name: 'drink',
    up: { called: false, param: null, time: null },
    down: { called: false, param: null, time: null },
};

module.exports = {
    up: async (db) => {
        await sleep(10);
        specs.up.called = true;
        specs.up.param = db;
        specs.up.time = Date.now();
    },
    down: async (db) => {
        await sleep(10);
        specs.down.called = true;
        specs.down.param = db;
        specs.down.time = Date.now();
    },
    specs,
};
