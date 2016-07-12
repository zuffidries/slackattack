
import botkit from 'botkit';

const Yelp = require('yelp');

console.log('starting bot');

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize yelpClient
const yelpClient = new Yelp({
  consumer_key: 'K2ZCQ2UufWj0QVnPsz1vQw',
  consumer_secret: 'i7ZWvzif2Lct8nIzUs_GwNG43tA',
  token: 'RPict_AM_-kyo39QJygtEwuTTpgkXDMc',
  token_secret: 'Ro8BseE0dQ4AqOjYHbcRh4CHO7E',
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// SLACKBOT GREETING

controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

// GENERAL RESPONSE MESSAGE

controller.on('message_received', (bot, message) => {
  bot.reply(message, 'What do you want from me glorious human?');
});

// USAGE MESSAGE

controller.hears('help', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'I can help you order food!');
});

/** ORDER FOOD **/
// ADAPTED FROM: https://github.com/howdyai/botkit/blob/master/examples/convo_bot.js

let type;
let loc;

controller.hears(['eat', 'food', 'hunger', 'hungry'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, askType);
});

function askType(response, convo) {
  convo.ask('What are you in the mood for?', (res, con) => {
    convo.say('Great');
    type = res.text;
    askLocation(res, con);
    convo.next();
  });
}

function askLocation(response, convo) {
  convo.ask('Where are you?', (res, con) => {
    convo.say('Copy that.');
    loc = res.text;
    search(res, con);
    convo.next();
  });
}

function search(response, convo) {
  yelpClient.search({ term: type, location: loc })
  .then(data => {
    data.businesses.forEach(business => {
      if (!business.is_closed) {
        convo.say(`${business.mobile_url}`);
      }
    });
    convo.next();
  });
}
