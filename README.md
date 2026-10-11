# UltraGuard (שומר אולטרסוני)

מערכת לגילוי, סיווג ופענוח של ביקונים אולטרסוניים בזמן אמת, עם דשבורד ווב חי.

הפרויקט מחולק לשני פרויקטים נפרדים, וכל אחד רץ בטרמינל משלו.

## הרצה בפיתוח

**שרת** (פורט 3000):

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**פרונט** (פורט 5173):

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

גולשים ל-`http://localhost:5173`. את הערכים ב-`backend/.env` מקבלים מהשותף, לא דרך גיט.

## בדיקות

```bash
cd frontend && npm test
cd backend && npm test
```

## מסמכים

- `CONVENTIONS.md`: כללי הכתיבה של הפרונט והמאזין.
- `BACKEND.md`: כללי הכתיבה של השרת.
