const { ChatManager, TokenProvider } = require('@pusher/chatkit');
const { JSDOM } = require('jsdom');
const util = require('util');
const prompt = require('prompt');

const nodeCompatibleChatkit = () => {
    const { window } = new JSDOM();
    global.window = window;
    global.navigator = {};
};

nodeCompatibleChatkit();

const main = async () => {
    try {
        //TODO: Create command line chat client 
    } catch(err) {
        console.log(`${err}`);
        process.exit(1);
    }
}

main();