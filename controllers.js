import { getAllItemsMenu, exitBackMenu } from "./keyboards"

// Функция инициализирует необходимые данные о товарах.
// Если параметр isChanged=true - функция возвращает объект
// с фотографией, описанием и клавиатурой. Если isChanged=false
// то вернется полноценный ответ.
export async function getAssortment(ctx, isChanged) {
    // Сохранить все элементы
    const allItems = ctx.session.allItems
    // Получить текущую страницу
    const currentPage = ctx.session.currentPage
    // Получить текущий элемент
    const oneItem = allItems[currentPage-1]
    // Глобально сохранить текущий элемент
    ctx.session.oneItem = allItems[currentPage-1]
    // Получить заголовок элемента
    const itemTitle = oneItem.title
    // Получить стоимость итема
    const itemPrice = oneItem.price.text
    // Получить массив фотографий одного элемента
    const oneItemPhotosArray = oneItem.photos[0].sizes
    // Получить главную фотографию
    const mainPhoto = oneItemPhotosArray[oneItemPhotosArray.length - 1].url     
    
    if (isChanged === true) {
        return {
            photo: {
                type: "photo",
                media: mainPhoto,
                caption: `${itemTitle}\n\n${itemPrice}`
            },
            keyboard: getAllItemsMenu(ctx.session.currentPage, ctx.session.itemsCount)
        }
    } else {
        await ctx.replyWithPhoto(
            mainPhoto,
            {
                caption: `${itemTitle}\n\n${itemPrice}`, 
                reply_markup: getAllItemsMenu(ctx.session.currentPage, ctx.session.itemsCount).reply_markup
            }
        )
    }
}

// Функция возвращает детальную информацию о товаре (все полученных из vk фото,
// подробное описание товара и инлайн-клавиатура)
export async function getDetailedPage(ctx) {
    ctx.replyWithChatAction('typing')
    // Получить один элемент
    const oneItem = ctx.session.oneItem
    // Получить описание одного элемента
    const itemDescription = oneItem.description
    // Получить цену
    const itemPrice = oneItem.price.text
    // Массив для всех фотографий элемента
    let photoList = []

    // Циклом мы пробегаемся по всем фотографиям и сохраняем в массив в требуемом формает
    for (let photoObj of oneItem.photos) {
        photoList.push({
            type: "photo",
            media: photoObj.sizes[photoObj.sizes.length - 1].url
        })   
    }  
    // Глобальное хранение массива фотографий
    ctx.session.photoList = photoList
    // Удаление последнего сообщения от бота
    await ctx.deleteMessage(ctx.callbackQuery.message.message_id)

    // Отдельно бот отправляет список фотографий и текст с инлайн-клавиатурой. Задержка в 0.2сек
    // добавлена для большей ясности в поведении бота
    setTimeout(async () => {
        await ctx.replyWithMediaGroup(photoList)
        await ctx.replyWithHTML(`<b>${itemPrice}</b>\n\n${itemDescription}`, exitBackMenu())
    }, 200)
}