import Markup from 'telegraf/markup'

// Главное меню
export const mainMenuKeyboard = Markup.keyboard([
    ['🏯 Главная', '📜 Ассортимент'],
    ['🚀 Условия доставки и оплаты']
]).resize().extra()

// Функция, возвращающая меню для перелистывания товаро в разделе "Ассортимент"
export function getAllItemsMenu(currentPage, pageCount) {
    return Markup.inlineKeyboard([
        [
            Markup.callbackButton('Подробнее','detailed')
        ],
        [
            Markup.callbackButton('<< Назад', 'prevPage'),
            Markup.callbackButton(`${currentPage} из ${pageCount}`, 'count'),
            Markup.callbackButton('Дальше >>', 'nextPage')
        ],
    ], {columns: 2}).extra()
}

// Меню для раздела "Подробнее"
export function exitBackMenu() {
    return Markup.inlineKeyboard([
        [Markup.callbackButton('🍵 Сделать заказ', 'getOrder')],
        [Markup.callbackButton('<< Вернуться назад', 'exitBack')]
    ], {columns: 1}).extra()
}