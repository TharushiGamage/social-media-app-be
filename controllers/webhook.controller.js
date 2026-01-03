const { Webhook } = require('svix');
const User = require('../models/User');

const clerkWebhook = async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    }

    // Get the headers
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).send('Error occured -- no svix headers');
    }

    // Get the body
    const body = req.body;

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return res.status(400).send('Error occured');
    }

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
    console.log('Webhook body:', evt.data);

    try {
        if (eventType === 'user.created') {
            await User.create({
                clerkId: evt.data.id,
                username: evt.data.username || evt.data.email_addresses[0].email_address.split('@')[0], // Fallback if username missing
                email: evt.data.email_addresses[0].email_address,
                profilePicture: evt.data.image_url,
            });
            console.log('User created in DB');
        }

        if (eventType === 'user.updated') {
            await User.findOneAndUpdate(
                { clerkId: evt.data.id },
                {
                    $set: {
                        username: evt.data.username || evt.data.email_addresses[0].email_address.split('@')[0],
                        email: evt.data.email_addresses[0].email_address,
                        profilePicture: evt.data.image_url,
                    },
                }
            );
            console.log('User updated in DB');
        }

        if (eventType === 'user.deleted') {
            await User.findOneAndDelete({ clerkId: evt.data.id });
            console.log('User deleted from DB');
        }

        return res.status(200).json({
            success: true,
            message: 'Webhook received',
        });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = { clerkWebhook };
