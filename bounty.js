const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Retrieve environment variables from .env file
const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Create a new Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { persistSession: false });

let lastRunDate = null;

client.once('ready', () => {
    console.log('The Artiber is ready and observing.');
    setInterval(checkAndRun, 10 * 1000); // Check every 10 secs
});

client.on('messageCreate', async message => {
    if (message.content === '!end' && !message.author.bot) {
        // Delete the command message to reduce channel clutter
        await message.delete().catch(error => console.error('Failed to delete the command message:', error));

        const channel = client.channels.cache.get(message.channelId);
        if (!channel) {
            console.log('The chamber of voices remains hidden.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x690FC3) // Mysterious purple
            .setTitle("Echoes of Completion")
            .setDescription("Hearken, participants of Green and Purple. The sands in the hourglass cease to flow; the bounty now sealed. No further quests shall alter the fate already woven.")
            .setFooter({ text: 'Rest now, warriors, until I call upon thee once more.' });

        await channel.send({ embeds: [embed] });
    }
});

async function checkAndRun() {
    const now = new Date();
    const ninePM = new Date(now);
    ninePM.setUTCHours(21, 0, 0, 0); // Set to 9pm UTC

    if (now > ninePM && (!lastRunDate || lastRunDate.getDate() !== now.getDate())) {
        lastRunDate = now;
        await fetchAndPost();
    }
}

async function fetchAndPost() {
    try {
        let { data: bountyList, error } = await supabase
            .from('BountyList')
            .select('*')
            .filter('Used', 'neq', 1);

        if (error) {
            console.error('Error fetching data:', error.message);
            return;
        }

        if (bountyList.length === 0) {
            console.log('No available bounties in BountyList.');
            return;
        }

        const randomIndex = Math.floor(Math.random() * bountyList.length);
        const bounty = bountyList[randomIndex];

        const channel = client.channels.cache.find(ch => ch.name === 'daily-bounty');
        if (!channel) {
            console.log('Channel not found.');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`**${bounty['Title']}**`)
            .addFields(
                { name: `**🎯 Name**`, value: `*${bounty['Title']}*` },
                { name: `**💰 Reward**`, value: `3000 points` },
                { name: `**📝 Description**`, value: `*${bounty['Short Description']}*` },
                { name: `**🔑 Password**`, value: generatePassword() }
            );

        if (bounty['More Information']) {
            embed.addFields({ name: '**💡 Additional Information**', value: `*${bounty['More Information']}*` });
        }

        if (bounty['Image']) {
            embed.setThumbnail(bounty['Image']);
        }

        const message = await channel.send({ embeds: [embed] });
        console.log(`Message sent successfully. Message ID: ${message.id}`);

        await supabase.from('BountyList').update({ Used: 1 }).eq('Key', bounty.Key);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

function generatePassword() {
    const randomWord = getRandomWord();
    const randomCode = getRandomCode();
    return `${randomWord}${randomCode}`;
}

function getRandomWord() {
    const skills = [
        'Taming', 'Shamanism', 'Warding', 'Artisan', 'Sailing', 'Attack', 'Strength', 'Defence', 'Ranged',
        'Prayer', 'Magic', 'Runecrafting', 'Construction', 'Hitpoints', 'Agility', 'Herblore', 'Thieving',
        'Crafting', 'Fletching', 'Slayer', 'Hunter', 'Mining', 'Smithing', 'Fishing', 'Cooking', 'Firemaking',
        'Woodcutting', 'Farming'
    ];
    const randomIndex = Math.floor(Math.random() * skills.length);
    return skills[randomIndex];
}

function getRandomCode() {
    return Math.floor(100 + Math.random() * 900);
}

client.login(BOT_TOKEN);
