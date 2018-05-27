const { ChatManager, TokenProvider } = require('@pusher/chatkit');
const { JSDOM } = require('jsdom');
const util = require('util');
const prompt = require('prompt');
const axios = require('axios');
const readline = require('readline');
const ora = require('ora');

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

    const spinner = ora();
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

        spinner.start('Authenticating...');
        await createUser(username);
        spinner.succeed(`Logged In As ${ username }`);

        const chatManager = new ChatManager({
            instanceLocator: 'v1:us1:7af82cb7-14d4-4157-8bb5-771964b5579b',
            userId: username,
            tokenProvider: new TokenProvider({ url: 'http://localhost:3001/authenticate' }),
        });

        spinner.start('Connecting To Pusher...')
        const currentUser = await chatManager.connect();
        spinner.succeed('Connected!')

        spinner.start('Finding Available Rooms...');
        const joinableRooms = await currentUser.getJoinableRooms();
        spinner.succeed('Rooms Found!');

        const availableRooms = [...currentUser.rooms, ...joinableRooms];

        console.log('Available Rooms:');
        availableRooms.forEach((room, index) => {
            console.log(`${ index } - ${ room.name }`);
        })

        const roomSchema = [

            {
                description: 'Select A Room',
                name: 'room',
                conform: v => {
                    if (v >= availableRooms.length) {
                        return false
                    }
                    return true
                },
                message: 'Room Must Only Be Numbers',
                required: true
            }
        ]

        const { room: chosenRoom } = await get(roomSchema);
        const room = availableRooms[chosenRoom];

        spinner.start(`Joining ${ chosenRoom }...`);
        await currentUser.subscribeToRoom({
            roomId: room.id,
            hooks: {
                onNewMessage: message => {
                    const { senderId, text } = message
                    
                    if(senderId === username) return
                    console.log(`${ senderId }: ${ text }`)
                }
            },
            messageLimit: 0
        });

        spinner.succeed(`Joined ${ room.name }!`)

        console.log(`Now In ${ room.name }`);

        const input = readline.createInterface({ input: process.stdin });
        input.on('line', async text => {
            await currentUser.sendMessage({ roomId: room.id, text });
        })

    } catch(err) {
        spinner.fail();
        console.log(`${err}`);
        process.exit(1);
    }
}

main();