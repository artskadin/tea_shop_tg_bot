import axios from 'axios'
import express from 'express'
import session from 'telegraf/session'
import {Telegraf} from 'telegraf'
import { BOT_TOKEN, VK_TOKEN } from './config'
import { mainMenuKeyboard } from './keyboards'
import { getAssortment, getDetailedPage } from './controllers'

// Инициализация приложения
const app = express()
// Тестовый get запрос
app.get('/', (req, res) => res.send('Hello world'))
// Создание экземпляра бота
const bot = new Telegraf(BOT_TOKEN)
// Использование сессий
bot.use(session())

// Обработчик команды /start
bot.start(async ctx => {
    try {
        // Получение всех элементов из vk
        const allItems = await axios.get(`https://api.vk.com/method/market.get?access_token=${VK_TOKEN}&v=5.107&owner_id=-181251548&extended=1`)
        // Глобальное сохранение всех товаров
        ctx.session.allItems = allItems.data.response.items
        // Глобальное сохранение кол-ва всех товаров
        ctx.session.itemsCount = allItems.data.response.count
        // Глобальное хранение текущей страницы (нужно для работы инлайн-кнопок "назад/дальше")
        ctx.session.currentPage = 1
        // Ответ бота
        ctx.replyWithHTML(
            'Добро пожаловать в <b>Чайный почитатель 茶崇拜者</b>. '+
            'Здесь вы можете ознакомиться с нашим ассортиментом. '+
            'Для нас чай - это хобби, поэтому продаем качественный товар, '+
            'который сами пьем и посуду, которой сами пользуемся.\n\n'+
            'Владелец: <a href="http://t.me/arutemu_su">Arutemu</a>', 
            {
                disable_web_page_preview: true,
                reply_markup: mainMenuKeyboard.reply_markup
            }
        )
    } catch (e) {
        console.log(e)
        ctx.reply('Возникла техническая неполадка')
    }
})

// Обработчик текста
bot.hears('🚀 Условия доставки и оплаты', async ctx => {
    try {
        ctx.telegram.sendMessage(
            ctx.chat.id, 
            '<b><u>Оплата товаров</u></b>\n'+
            'Для заказа интересующего товара достаточно написать местному <a href="http://t.me/arutemu_su">Даймё</a>. Не стоит забывать указывать свои почтовые данные <code>(Ф.И.О., Область, город, адрес, почтовый индекс)</code>.\n\n' +
            '<i>Способы оплаты:</i> Сбербанк, Qiwi, Яндекс Деньги.\n\n\n' +
            '<b><u>Доставка товаров</u></b>\n' +
            'Доставка осуществляется по 100% предоплате. Осуществляется при помощи Почты РФ. В среднем это 300 руб, но в зависимости от региона цена может быть меньше или больше. Среднее время доставки по России 7-10 дней.',
            {
                parse_mode: 'HTML', 
                disable_web_page_preview: true, 
                reply_markup: mainMenuKeyboard.reply_markup
            }
        )
    } catch (e) {
        console.log(e)
        ctx.replyWithHTML('Упс. Не удалось загрузить данные. Попробуйте начать с команды <code>/start</code>')
    }
})

// Обработчик текста
bot.hears('🏯 Главная', async ctx => {
    try {
        // Фото логотипа магазина
        const teaVotaryPhoto = 'AgACAgIAAxkBAAMaXuJySbrb7WB9pI4WYQ_j76o9GXcAAuSsMRsxiRlL1Pa6TferXy5SHZqVLgADAQADAgADbQADVUgAAhoE'
        // Заготовленный текст
        const welcomeText = 
            'Небольшой магазинчик <i>Даймё</i> на пенсии, который занялся чайным делом. Рассказываю про постижение чайного гунфу, созидаю хокку, делюсь чаем и чайной утварью по России.\n\n'+
            'Владелец: <a href="http://t.me/arutemu_su">Arutemu</a>\n'+
            'Магазин в vk: <a href="https://vk.com/tea_votary">Чайный почитатель 茶崇拜者</a>\n\n'+
            'В душе тревога.\n'+
            'Решил отведать чаю.\n'+
            'Спокоен буси'

        // Ответ бота, содержащий фотографию и текст
        await ctx.telegram.sendPhoto(
            ctx.chat.id, 
            teaVotaryPhoto,
            {
                caption: `${welcomeText}`,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }
        )
    } catch(e) {
        console.log(e)
        ctx.replyWithHTML('Упс. Не удалось загрузить данные. Попробуйте начать с команды <code>/start</code>')
    }
})

// Обработчик текста
bot.hears('📜 Ассортимент', async ctx => {
    try {
        // Вызов функции, которая заставит бота отправить фото товаров с коротким описанием и инлайн-клавиатурой
        await getAssortment(ctx, false)

    } catch (e) {
        console.log(e)
        ctx.replyWithHTML('Упс. Не удалось загрузить данные. Попробуйте начать с команды <code>/start</code>')
    }
})

// вызывается при нажатии на инлайн-кнопку "Подробнее"
bot.action('detailed', async ctx => {
    try {
        // Вызов функции, которая заставит бота отправить список фотографий конкретного
        // товара с подробным описанием
        await getDetailedPage(ctx)
    } catch(e) {
        console.log(e)
        ctx.replyWithHTML('Упс. Не удалось загрузить данные. Попробуйте начать с команды <code>/start</code>')
    }
})

// вызывается при нажатии на кнопку "<< Вернуться назад"
bot.action('exitBack', async ctx => {
    try {
        // При отправке нескольких фотографий в телеграме каждая имеет свой id. 
        // Все фотографии глобально хранятся в ctx.session.photoList.
        // Чтобы их удалить, необходимо получить длину массива ctx.session.photoList и 
        // прибавить 1 т.к. описание товара с клавиатурой - это отдельное сообщение.
        // После чего циклом for можно удалять сообщения по их id с самого последнего.
        const delMessage = ctx.session.photoList.length + 1
        for (let i = 0; i < delMessage; i++) {
            await ctx.deleteMessage(ctx.callbackQuery.message.message_id-i)
        }

        // Вызов функции, которая заставит бота отправить фото товаров с коротким описанием и инлайн-клавиатурой
        await getAssortment(ctx, false)
    } catch(e) {
        console.log(e)
        console.log('Не удалось вернуться назад exitBack')
    }
})

// вызывается при нажатии на кнопку "<< Назад"
bot.action('prevPage', async ctx => {
    try {
        // Идет проверка: если текущая страница не равна 1
        // тогда отнимает от текущей страницы 1 и изменяет последнее сообщение от бота
        if (ctx.session.currentPage !== 1) {
            ctx.session.currentPage = ctx.session.currentPage - 1

            const data = await getAssortment(ctx, true)
            // Сообщения с одной фотографией, кратким описанием и инлайн-клавиатурой изменяется
            await ctx.editMessageMedia(
                data.photo, 
                {reply_markup: data.keyboard.reply_markup}
            )
        }
    } catch(e) {
        console.log(e)
        console.log('Не удалось получить предыдущую страницу')
    }
})

// Вызывается при нажатии на кнопку "Дальше >>"
bot.action('nextPage', async ctx => {
    try {
        // Логика работы идентична prevPage, только здесь
        // текущая страница увеличивается на 1
        if (ctx.session.currentPage !== ctx.session.itemsCount) {
            ctx.session.currentPage = ctx.session.currentPage + 1
            
            const data = await getAssortment(ctx, true)
            await ctx.editMessageMedia(
                data.photo, 
                {reply_markup: data.keyboard.reply_markup}
            )
        }
    } catch(e) {
        console.log(e)
        console.log('Не удалось получить следующую страницу')
    }
})

// Вызывается при нажатии "Сделать заказ"
bot.action('getOrder', ctx => {
    try {
        // Вывод сообщения с ссылкой на владельца магазина
        ctx.replyWithHTML(
            'Для заказа интересующего товара Вы можете связаться с \n'+
            '<a href="http://t.me/arutemu_su">Arutemu</a>',
            {disable_web_page_preview: true}
        )
    } catch(e) {
        console.log(e)
    }
})

// Стоит в самом конце, чтобы, если пользователь введет любой текст
// не удовлетворяющий условиям выше, обработать его и выдать простой ответ.
bot.on('text', ctx => {
    ctx.reply('Лучше загляните в наш ассортимент')
})

bot.launch()
app.listen(3000, () => console.log('Server is running on port 3000'))

