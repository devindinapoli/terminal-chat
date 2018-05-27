const { ChatManager, TokenProvider } = require('@pusher/chatkit');
const { JSDOM } = require('jsdom');
const util = require('util');
const prompt = require('prompt');
const axios = require('axios');

const nodeCompatibleChatkit = () => {
    const { window } = new JSDOM();
    global.window = window;
    global.navigator = {};
};

nodeCompatibleChatkit();

const createUser = async username => {
    try {
        await axios.post('http://localhost:3001/users', { username })
    } catch( { message }) {
        throw new Error(`${ message }`)
    }
};

const main = async () => {
    try {
        // Start prompt with an empty message
        prompt.start();
        prompt.message = '';

        const get = util.promisify(prompt.get);

        const usernameSchema = [
            {
                description: 'Enter Your Username',
                name: 'username',
                required: true,
            },
        ];

        const { username } = await get(usernameSchema);
        await createUser(username);

        const chatManager = new ChatManager({
            instanceLocator: 'v1:us1:7af82cb7-14d4-4157-8bb5-771964b5579b',
            userId: username,
            tokenProvider: new TokenProvider({ url: 'http://localhost:3001/authenticate' }),
        });
        const currentUser = await chatManager.connect();

        const joinableRooms = await currentUser.getJoinableRooms();
        const availableRooms = [...currentUser.rooms, ...joinableRooms];

        console.log('Available Rooms:');
        availableRooms.forEach((room, index) => {
            console.log(`${ index } - ${ room.name }`);
        });

    } catch(err) {
        console.log(`${err}`);
        process.exit(1);
    }
}

main();