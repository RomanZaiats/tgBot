// Dependencies
const TelegramBot = require('node-telegram-bot-api');
//const { Configuration, OpenAIApi } = require('openai');
const knex = require('knex');
const _ = require('lodash');
const url = 'https://c0c3-194-44-57-32.ngrok-free.app';
const TOKEN = '6298867920:AAEItyjwbgMD9JGP3KlEC-_cDm2WOkj1cco';

const knexConfig = require('./config/knex');
const knexDb = knex(knexConfig);
// Configurations
const bot = new TelegramBot(TOKEN, {polling: true});

// This informs the Telegram servers of the new webhook.
bot.setWebHook(`${url}/bot${TOKEN}`);

const optionsPerPage = 9; 
const optionsPerRow = 3; 


bot.onText(/\/start/, async (msg) => {
  const { id: userTgId } = msg.from;
  const chatId = msg.chat.id;
  const user = await knexDb('users').where({ tgId: userTgId }).first();

  if (user) {
    bot.sendMessage(chatId, `Вітаємо знову ${user.firstName} ${user.lastName}`, {
      "reply_markup": {
          "keyboard": [["Запис до лікаря"], ["Мої візити"]]
        }
      });
  } else {
    const newUserData = msg.from;
    const [{ firstName, lastName }] = await knexDb('users').insert({
      tgId: newUserData.id,
      firstName: newUserData.first_name,
      lastName: newUserData.last_name,
      username: newUserData.username,
      chatId: chatId
    }, ['firstName', 'lastName']);

    bot.sendMessage(chatId, `Вітаємо ${firstName} ${lastName}`, {
      "reply_markup": {
            "keyboard": [["Запис до лікаря"], ["Мої візити"]]
          }
      });
  }
});
// const openai = new OpenAIApi(new Configuration({
//   apiKey: ''  put key
// }));
bot.onText(/Задати питання/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Щоб задати питання, напишіть повідомлення у форматі \n'/ask ... Ваше питання'`);
});

bot.onText(/\/ask/, async (msg) => {
  const parsed = msg.text.substring(5);
  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: `${parsed}.\n`,
    temperature: 0.6,
    max_tokens: 1024,
    stream: false
  });

  const {text} = completion.data.choices.pop();
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, text);
});

bot.onText(/\/location/, async (msg) => {
  const chatId = msg.chat.id;
  const latitude = 51.5074; // Replace with the latitude you want to send
const longitude = -0.1278; // Replace with the longitude you want to send
  bot.sendMessage(chatId, `Here is a location I want to share with you! https://www.google.com/maps?q=${latitude},${longitude}`);
});

bot.onText(/Мої візити/, async (msg) => {
  const chatId = msg.chat.id;
  const { id: userTgId } = msg.from;

  const user = await knexDb('users').where({ tgId: userTgId }).first();

  const appointments = await knexDb('appointments as a')
    .select(
      'a.id',
      'a.datetime',
      'a.isHappened',
      'u.firstName',
      'u.lastName',
      'd.specialization')
    .innerJoin('users as u', 'u.id', 'a.doctorId')
    .innerJoin('doctors as d', 'd.userId', 'a.doctorId')
    .where('a.userId', user.id)
    .orderBy('id');

  const req = {
    reply_markup: {
      inline_keyboard: appointments.map(x => {
        return [
          {
            text: `${x.specialization}, ${x.firstName} ${x.lastName},  ${x.datetime} ${x.isHappened ? '\u2705' : '\u{1F51C}'}`,
            callback_data: `appointment~${x.id}`
          }
        ]
      })
    }
  };
  
  bot.sendMessage(chatId, 'Ваші візити:', req);
});

const getProfsPage = async (currentPage, goToPage = null) => {
  const doctorProfessions = await knexDb.select('specialization').from('doctors');
  const unqProfs = new Set(doctorProfessions.map(x => x.specialization));
  const options = [...unqProfs].map(prof => {
    return {
      text: prof,
      callback_data: `prof~${prof}`
    }
  });

  // calculate the total number of pages
  const totalPages = Math.ceil(options.length / optionsPerPage);
  let displayPage = currentPage;

  if (goToPage === 'previous') {
    displayPage--;

    // make sure we don't go below page 1
    if (displayPage < 1) {
      displayPage = 1;
      return null;
    }
  } // if the user selected the 'next' button
  else if (goToPage === 'next') {
    displayPage++;

    // make sure we don't go above the last page
    if (displayPage > totalPages) {
      displayPage = totalPages;
      
      return null;
    }
  }
  
  const startIndex = (displayPage - 1) * optionsPerPage;
  const endIndex = startIndex + optionsPerPage;

  const pageOptions = options.slice(startIndex, endIndex);
  const rowOptions = [
    pageOptions.slice(0, optionsPerRow),
    pageOptions.slice(optionsPerRow, optionsPerRow*2),
    pageOptions.slice(optionsPerRow*2, optionsPerRow*3),
  ]


  return [
    ...rowOptions,
    [{ text: '<<<', callback_data: JSON.stringify({currentPage: displayPage, goToPage: 'previous'}) },{ text: '>>>', callback_data: JSON.stringify({currentPage: displayPage, goToPage: 'next'}) }]
  ]
}

bot.onText(/Запис до лікаря/, async (msg) => {
  const chatId = msg.chat.id;

  const firstPageOfProfessions = await getProfsPage(1);
  const req = {
    reply_markup: {
      inline_keyboard: firstPageOfProfessions
    }
  };

  bot.sendMessage(chatId, 'Виберіть спеціальність лікаря:', req);
});

const addDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

const getDateMarkup = (prevCallback, docsAppointments) => {
  const inline1 = [];
  const inline2 = [];
  for (let index = 0; index < 6; index++) {
    if (index > 2) {
      const date = addDays(new Date(), index);
      inline2.push({
        text: date,
        callback_data: `date~${date};${prevCallback}`
      })
    } else {
      const date = addDays(new Date(), index);
      inline1.push({
        text: date,
        callback_data: `date~${date};${prevCallback}`
      })
    }
  }
  return [
    inline1,
    inline2,
  ];
};

const getTimeMarkup = (prevCallback, bookedHours) => {
  const inline1 = [];
  const inline2 = [];
  const inline3 = [];

  for (let index = 9; index < 18; index++) {
    if (index > 14) {
      const time = `${index}:00`;
      if (bookedHours.includes(time)){
        inline3.push({
          text: `${time}\u{1F512}`,
          callback_data: ' '
        })
      } else {
        inline3.push({
          text: `${time}`,
          callback_data: `time~${time};${prevCallback}`
        })
      };
    } else if (index > 11) {
      const time = `${index}:00`;
      if (bookedHours.includes(time)){
        inline2.push({
          text: `${time}\u{1F512}`,
          callback_data: ' '
        })
      } else {
        inline2.push({
          text: `${time}`,
          callback_data: `time~${time};${prevCallback}`
        })
      };
    } else {
      const time = `${index}:00`;
      if (bookedHours.includes(time)){
        inline1.push({
          text: `${time}\u{1F512}`,
          callback_data: ' '
        })
      }else {
        inline1.push({
          text: `${time}`,
          callback_data: `time~${time};${prevCallback}`
        })
      };
    }
  }

  return [
    inline1,
    inline2,
    inline3,
  ]
};

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const { id: userTgId } = callbackQuery.from;

  if (callbackQuery.data.startsWith('appointment')) {
    const appointmentId = callbackQuery.data.split('~')[1];
    const {isHappened, address, datetime, firstName, lastName, specialization, summaryPath} = await knexDb('appointments as a')
    .select(
      'a.id',
      'a.datetime',
      'a.isHappened',
      'u.firstName',
      'u.lastName',
      'd.specialization',
      'd.address',
      'a.summaryPath')
    .innerJoin('users as u', 'u.id', 'a.doctorId')
    .innerJoin('doctors as d', 'd.userId', 'a.doctorId')
    .where('a.id', appointmentId)
    .first();

    if (isHappened) {
      bot.sendMessage(chatId, `Ваш візит до лікаря (${specialization}) ${firstName} ${lastName}\nвідбувся ${datetime}. ${summaryPath ? 'Висновок лікаря:' : 'Даний візит не має файла з висновком'}`);
      
      if (summaryPath) {
        bot.sendDocument(chatId, summaryPath)
      }
    } else {
      const loc = address.split(',');
      const latitude = Number(loc[0]);
      const longitude = Number(loc[1]);
      bot.sendMessage(chatId, `Ваш візит до лікаря (${specialization}) ${firstName} ${lastName}\nвідбудеться ${datetime}. Локація:`);
      bot.sendLocation(chatId, latitude, longitude);
    }
  }

  if (callbackQuery.data.startsWith('doc')) {
    const user = await knexDb('users').where({ tgId: userTgId }).first();

    const date = callbackQuery.data.split(';')[2].split('~')[1];
    const time = callbackQuery.data.split(';')[1].split('~')[1];
    const doctorId = callbackQuery.data.split(';')[0].split('~')[1];

    await knexDb('appointments').insert({
      userId: user.id,
      doctorId,
      datetime: `${date} ${time}`
    });

    const editedMsg = {
      chat_id: chatId, 
      message_id: messageId
    };

    // update the message with the new keyboard
    await bot.editMessageText(`Запис походу до спеціаліста успішно сформовано! (Деталі можна переглянути в меню "Мої візити")`, editedMsg);
    bot.answerCallbackQuery(callbackQuery.id, { text: '', cache_time: 0 });
  }

  if (callbackQuery.data.startsWith('time')) {
    const profession = callbackQuery.data.split(';')[2].split('~')[1];
    const date = callbackQuery.data.split(';')[1].split('~')[1];
    const time = callbackQuery.data.split(';')[0].split('~')[1];
    const doctorsByProf = await knexDb('users').innerJoin('doctors', 'users.id', 'doctors.userId').where({ specialization: profession });
    const docsAppointments = await knexDb('appointments').whereIn('doctorId', doctorsByProf.map(x => x.userId));
    const info = doctorsByProf.map(x => {
      if (docsAppointments.find(y => y.datetime === `${date} ${time}` && y.doctorId === x.userId)) {
        return [{
          text: `${x.firstName} ${x.lastName}\u{1F512}`,
          callback_data: ' '
        }]
      } else {
        return [{
          text: `${x.firstName} ${x.lastName}`,
          callback_data: `doc~${x.userId};${callbackQuery.data}`
        }]
      }
    });

    const editedMsg = {
      chat_id: chatId, 
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          ...info
        ]
      }
    }

    // update the message with the new keyboard
    bot.editMessageText(`Виберіть лікаря (${profession}) з доступних на цю дату і час (${date} ${time}):`, editedMsg);
  } 

  if (callbackQuery.data.startsWith('date')) {
    const profession = callbackQuery.data.split(';')[1].split('~')[1];
    const date = callbackQuery.data.split(';')[0].split('~')[1];
    const doctorsByProf = await knexDb('users').innerJoin('doctors', 'users.id', 'doctors.userId').where({ specialization: profession });
    const docsAppointments = await knexDb('appointments').whereIn('doctorId', doctorsByProf.map(x => x.userId));
    const appointsForDate = docsAppointments.filter(x => x.datetime.startsWith(date));
    const groupedByDateTime = _(appointsForDate)
      .groupBy(x => x.datetime)
      .map((value, key) => ({datetime: key, appointments: value}))
      .value();
    
    const bookedHours = groupedByDateTime.filter(x => x.appointments.length === doctorsByProf.length).map(x => x.datetime.substring(11));

    const timeMarkup = getTimeMarkup(callbackQuery.data, bookedHours);
    const editedMsg = {
      chat_id: chatId, 
      message_id: messageId, 
      reply_markup: {
        inline_keyboard: timeMarkup
      }
    };

    // update the message with the new keyboard
    bot.editMessageText(`Виберіть час для походу до спеціаліста (${date} ${profession}):`, editedMsg);
  }

  if (callbackQuery.data.startsWith('prof')) {
    const profession = callbackQuery.data.split('~')[1];
    const doctorsByProf = await knexDb('users').innerJoin('doctors', 'users.id', 'doctors.userId').where({ specialization: profession });
    const docsAppointments = await knexDb('appointments').whereIn('doctorId', doctorsByProf.map(x => x.userId));
    const dateMarkup = getDateMarkup(callbackQuery.data, docsAppointments);
    const editedMsg = {
      chat_id: chatId, 
      message_id: messageId, 
      reply_markup: {
        inline_keyboard: dateMarkup
      }
    };

    // update the message with the new keyboard
    bot.editMessageText(`Виберіть дату для походу до спеціаліста (${profession}):`, editedMsg);
  }

  if (callbackQuery.data.includes('currentPage')) {
    const data = JSON.parse(callbackQuery.data);
    const { currentPage, goToPage } = data;

    const updaytedInlineKeyboard = await getProfsPage(currentPage, goToPage);

    if (!updaytedInlineKeyboard) {
      bot.answerCallbackQuery(callbackQuery.id, { text: '', cache_time: 0 });
      return;
    }

    // update the message with the new keyboard
     bot.editMessageReplyMarkup({ inline_keyboard: updaytedInlineKeyboard }, { chat_id: chatId, message_id: messageId });
  }
});
