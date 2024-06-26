// Import necessary modules
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/Users/Tom/Documents/GBvsRF/.env' });

// Retrieve environment variables from .env file
const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Create a new Discord client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Create a Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { persistSession: false });

// Event handler for when the bot is ready
client.once('ready', async () => {
    console.log('Bot is ready!');

    // Fetch and post bounties
    await fetchAndPost();

    // End the client session after the task is done
    client.destroy();
});

// Log in to Discord using the bot token
client.login(BOT_TOKEN);

// List of skills
const skills = [
    'Taming', 'Shamanism', 'Warding', 'Artisan', 'Sailing', 'Attack', 'Strength', 'Defence', 'Ranged',
    'Prayer', 'Magic', 'Runecrafting', 'Construction', 'Hitpoints', 'Agility', 'Herblore', 'Thieving',
    'Crafting', 'Fletching', 'Slayer', 'Hunter', 'Mining', 'Smithing', 'Fishing', 'Cooking', 'Firemaking',
    'Woodcutting', 'Farming'
];

// Function to generate a random word from the list
function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * skills.length);
    return skills[randomIndex];
}

// Function to generate a random 3-digit code
function getRandomCode() {
    return Math.floor(100 + Math.random() * 900);
}

// Function to generate the task-specific password
function generatePassword() {
    const randomWord = getRandomWord();
    const randomCode = getRandomCode();
    return `${randomWord}${randomCode}`;
}

// Function to fetch and post bounties
async function fetchAndPost() {
    try {
        // Fetch all bounties that are not marked as used from the database
        let { data: bountyList, error } = await supabase
            .from('BountyList')
            .select('*')
            .filter('Used', 'neq', 1); // Filter out bounties where Used is not equal to 1 (not used)

        // Handle any errors that occur during fetching
        if (error) {
            console.error('Error fetching data:', error.message);
            return;
        }

        // If there are no available bounties, log it and return
        if (bountyList.length === 0) {
            console.log('No available bounties in BountyList.');
            return;
        }

        // Randomly select one bounty from the retrieved list
        const randomIndex = Math.floor(Math.random() * bountyList.length);
        const bounty = bountyList[randomIndex];

        // Find the Discord channel to post the bounty in
        const channel = client.channels.cache.find(ch => ch.name === 'gbrf-bot-test');
        if (!channel) {
            console.log('Channel not found.');
            return;
        }

        console.log(`Processing bounty with Key: ${bounty.Key}`);

        // Construct an embed for the bounty
        const embed = new EmbedBuilder();
        embed.setTitle(`**${bounty['Title']}**`);
        embed.addFields(
            { name: `**🎯 Name**`, value: `*${bounty['Title']}*` },
            { name: `**💰 Reward**`, value: `1500 points` },
            { name: `**📝 Description**`, value: `*${bounty['Short Description']}*` },    
            { name: `**🔑 Password**`, value: generatePassword() }                
        );

        // Add additional information to the embed if available
        if (bounty['More Information']) {
            embed.addFields({ name: '**💡 Additional Information**', value: `*${bounty['More Information']}*` });
        }

        // Set thumbnail for the embed if an image is available
        if (bounty['Image']) {
            embed.setThumbnail(bounty['Image']);
        }

        // Log the channel where the message will be sent
        console.log(`Sending message to Discord channel: ${channel.name}`);

        // Send the embed message to the Discord channel and get the message ID
        const message = await channel.send({ embeds: [embed] });
        console.log(`Message sent successfully. Message ID: ${message.id}`);

        // Log that the bounty has been posted
        console.log(`Bounty with Key: ${bounty.Key} posted.`);

        // Update the Used field of the selected bounty to mark it as used in the database
        await supabase.from('BountyList').update({ Used: 1 }).eq('Key', bounty.Key);

        // Log that the Used field has been updated for the bounty
        console.log(`Used field updated for bounty with Key: ${bounty.Key}`);

    } catch (error) {
        // Handle any errors that occur during the process
        console.error('An error occurred:', error);
    }
}
