const Handler = require('./handler.js');

test('Subscribers receive messages', () => {
    let handler = new Handler();
    let count = 0;
    handler.subscribe('app', msg => count += msg.val);
    handler.publish('app', {val: 3});
    expect(count).toBe(3);
});

test('Subscribers only receive messages for their tag', () => {
    let handler = new Handler();
    let count = 0;
    handler.subscribe('app', msg => count += msg.val);
    handler.subscribe('proxy', msg => {});
    handler.publish('proxy', {val: 3});
    expect(count).toBe(0);
});

test('Publish with no subscribers has no effect', () => {
    let handler = new Handler();
    handler.publish('proxy', {val: 3});
});