# Архитектура (микросервисы) — пример

Структура:
- frontend/
  - index.html
- services/
  - tasks-service/
    - index.js
    - package.json
    - data/tasks.json
    - public/images/ (перенесите сюда картинки)
  - student-service/
    - index.js
    - package.json
    - data/students.json
  - teacher-service/
    - index.js
    - package.json

Инструкция по запуску (локально):
1. Убедитесь, что у вас установлен Node.js (>=16).
2. Для каждого сервиса:
   - Откройте терминал в папке `services/<service-name>`
   - Выполните `npm install`
   - Затем `node index.js`
   - По умолчанию:
     - tasks-service: http://localhost:3001
     - student-service: http://localhost:3002
     - teacher-service: http://localhost:3003
3. Фронтенд:
   - Вы можете открыть `frontend/index.html` в браузере, но браузерные политики могут блокировать fetch с file://.
   - Рекомендуется запустить простой статический сервер, например:
     - `npx serve frontend -p 3000` или
     - `npx http-server frontend -p 3000`
   - Затем откройте http://localhost:3000

Примечания:
- JSON-файлы содержат исходные данные (tasks.json, students.json). При работе сервисы будут изменять students.json.
- Это демо-реализация. В проде нужно добавить:
  - правильную обработку конкурентного доступа (блокировки/база данных),
  - валидацию входных данных,
  - аутентификацию/авторизацию,
  - логирование, тесты и backup данных.

# Дополнения — badges-service и UI изменения

Как запустить новые сервисы:
1. badges-service:
   - cd services/badges-service
   - npm install
   - node index.js (по умолчанию порт 3004)

2. teacher-service:
   - если вы изменяли файл, перезапустите teacher-service:
     - cd services/teacher-service
     - npm install
     - node index.js (порт 3003)

3. frontend:
   - замените frontend/index.html на обновлённую версию (см. ниже)
   - откройте через статический сервер (например, `npx serve frontend -p 3000`)

Путь запросов:
- GET http://localhost:3004/badges — список доступных ачивок
- GET http://localhost:3003/badges — проксирует badges-service (используйте эту точку с фронтенда)
- POST http://localhost:3003/students/:login/badges — выдать бейдж студенту (как раньше)

Замечание:
- Для production лучше хранить badges в БД и защищать эндпоинты (аутентификация/авторизация).

