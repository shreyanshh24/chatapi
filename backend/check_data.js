const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        // Group by conversationId
        const conversations = await Message.aggregate([
            { $group: { _id: "$conversationId", count: { $sum: 1 } } }
        ]);

        console.log('Conversations:');
        console.log(JSON.stringify(conversations, null, 2));

        const users = await User.find().limit(5);
        console.log('Users:');
        console.log(JSON.stringify(users, null, 2));

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
