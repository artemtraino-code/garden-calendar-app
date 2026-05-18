# GitHub backup setup

Проект календаря хранится отдельно от магазина в папке:

```text
C:\Users\artem\OneDrive\Документы\seeds\garden-calendar-app
```

Локальный git-репозиторий должен быть самостоятельным. Его не нужно добавлять внутрь репозитория магазина.

## Что сохраняем

- код приложения: `index.html`, `src/`, `package.json`;
- текущие стартовые данные календаря: `src/sample-data.js`;
- резервную копию текущего состояния: `data/garden-calendar-state-2026-05-18.json`.

## Подключение к GitHub после установки `gh`

```powershell
cd C:\Users\artem\OneDrive\Документы\seeds\garden-calendar-app
gh auth login
gh repo create garden-calendar-app --private --source . --remote origin --push
```

Если репозиторий уже создан на GitHub вручную:

```powershell
cd C:\Users\artem\OneDrive\Документы\seeds\garden-calendar-app
git remote add origin https://github.com/<owner>/garden-calendar-app.git
git push -u origin main
```
