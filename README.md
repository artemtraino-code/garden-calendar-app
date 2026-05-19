# Garden Calendar App

Отдельное локальное приложение для планирования садово-огородных работ.  
Проект не связан с `seeds.dp.ua`, WooCommerce или WordPress и должен жить как самостоятельное приложение.

## Текущий статус

Приложение уже умеет:

- показывать общую ленту работ;
- хранить настройки в локальном состоянии браузера;
- вести справочники:
  - групп;
  - культур;
  - работ;
  - препаратов;
- создавать и редактировать задания;
- поддерживать статусы:
  - `Запланировано`;
  - `Выполнено`;
  - `Пропущено`;
- поддерживать повторения;
- работать с мультивыбором в формах;
- группировать связанные задания в одну карточку ленты;
- использовать локальные изображения препаратов.

## Главный документ

Текущее целевое устройство приложения, механика форм, статусов, batch-логики и карточек ленты описаны здесь:

- [docs/app-blueprint.md](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/docs/app-blueprint.md)

Этот файл теперь считается базовой технической схемой проекта.

## Запуск

```powershell
cd C:\Users\artem\OneDrive\Документы\seeds\garden-calendar-app
python -m http.server 5199
```

После запуска открыть:

```text
http://localhost:5199/
```

## Публикация

Бюджетный первый вариант публикации - GitHub Pages.

- репозиторий: `artemtraino-code/garden-calendar-app`;
- сайт после включения Pages будет открываться как статическое веб-приложение;
- приложение подготовлено как PWA: есть `manifest.webmanifest`, `sw.js` и иконка;
- service worker не включается на `localhost`, чтобы при разработке не застревала старая версия.

Инструкция и порядок включения Pages:

- [docs/deployment.md](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/docs/deployment.md)

## Текущие ограничения

- данные пока хранятся только локально в браузере;
- полноценного backend-слоя пока нет;
- синхронизации между устройствами пока нет;
- push / Telegram / Google Calendar интеграции пока нет;
- текущий этап — стабилизация механик и сборка единой внутренней архитектуры приложения.

## Основные файлы

- [index.html](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/index.html)
- [src/app.js](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/src/app.js)
- [src/calendar.js](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/src/calendar.js)
- [src/storage.js](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/src/storage.js)
- [src/sample-data.js](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/src/sample-data.js)
- [src/styles.css](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/src/styles.css)
- [manifest.webmanifest](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/manifest.webmanifest)
- [sw.js](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/sw.js)

## GitHub

- инструкция для подключения отдельного репозитория лежит в [docs/github-setup.md](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/docs/github-setup.md);
- перед следующей крупной переработкой интерфейса ориентироваться на [docs/app-blueprint.md](C:/Users/artem/OneDrive/Документы/seeds/garden-calendar-app/docs/app-blueprint.md).
