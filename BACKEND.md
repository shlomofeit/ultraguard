# UltraGuard: עקרונות כתיבת קוד לשרת (`src/`)

> **לכלי ה-AI:** המסמך הזה קובע את הסגנון של כל קוד השרת בתיקייה `src/`. הוא מבוסס על הסגנון האישי של אבי (פרויקט tzofia-eye), עם התאמות לפרויקט הזה. פעל לפי הכללים כאן. כשאין כלל שמכסה מקרה, בחר את הפתרון הפשוט ביותר שדומה לקוד הקיים. אל תוסיף ספריות, תבניות או מבנים שלא מופיעים כאן בלי לשאול.
>
> הפרונט (`public/`) כתוב לפי `CONVENTIONS.md`, לא לפי המסמך הזה. החוזה בין המאזין לשרת (סעיף 9) מחייב את שני הצדדים.
>
> כל השאלות הפתוחות מהמסמך האישי של אבי (סעיף 8 שם) שנוגעות לשרת הוכרעו כאן. אין צורך לשאול עליהן.

---

## 1. כללי

| איפה | מה |
|---|---|
| שרת | JavaScript (לא TypeScript), ES Modules, Express 5, socket.io, MongoDB driver רשמי (`mongodb`, בלי Mongoose), `@supabase/supabase-js`, zod 4, bcrypt, jsonwebtoken, cookie-parser, helmet, express-rate-limit, dotenv, pdfkit |

- ייבוא קבצים מקומיים תמיד עם סיומת `.js`.
- `async/await` בלבד. אין `.then` בשום מקום.
- אין הערות בקוד. יוצא מן הכלל: `/** @type {Collection} */` מעל `const collection` ב-repository של מונגו.
- הודעות שגיאה מהשרת באנגלית, משפט קצר שנגמר ב-`!`: `'Room not found!'`. הפרונט מציג למשתמש הודעות משלו בעברית.
- מרכאות יחידות (`'`), נקודה-פסיק בסוף כל משפט, הזחה של 2 רווחים, עד כ-80 תווים בשורה.
- פסיק אחרון במערכים, באובייקטים וב-imports מרובי שורות. לא בארגומנטים של קריאה לפונקציה.
- סוגריים תמיד סביב פרמטר של arrow: `(row) => row.id`.
- שורה ריקה בין בלוקים לוגיים, ותמיד לפני `res.json(...)` או `return` סופי בפונקציה ארוכה מ-3 שורות.
- תוצאה של קריאה מקבלת שם ואז מוחזרת: `const rooms = await ...; return rooms;`.
- קבועי מודול ב-`UPPER_SNAKE_CASE`: `const PORT = process.env.PORT;`.

---

## 2. מבנה תיקיות

```
src/
├── app.js            # Express: middlewares גלובליים, routers, 404, errorHandler. מייצא את app
├── server.js         # שרת HTTP, socket.io, ו-listen
├── db/               # supabase.js, mongo.js
├── routes/           # <domain>.routes.js, כולל ה-handler עצמו
├── sockets/          # <name>.socket.js, המקביל של routes להודעות socket.io
├── services/         # <domain>.service.js
├── repositories/     # <domain>.repo.js
└── utils/            # middlewares, validation.js, errorHandler.js, socketEvents.js, generateToken.js
```

| תיקייה | אחריות |
|---|---|
| `app.js` | הקמת Express. סדר middlewares: `express.json()`, `cookieParser()`, `helmet()`. אחר כך ה-routers, ה-404 וה-`errorHandler` |
| `server.js` | `http.createServer(app)`, חיבור socket.io, רישום ה-sockets, `listen` |
| `db/` | חיבור יחיד לכל מסד |
| `routes/` | נתיב, שרשרת middlewares, וה-handler. אין תיקיית controllers |
| `sockets/` | אימות החיבור, קבלת הודעה, קריאה ל-service, החזרת אישור קבלה |
| `services/` | ולידציה, כללים עסקיים, זריקת שגיאות עם `status`, המרת צורת המסמך |
| `repositories/` | גישה למסד בלבד |
| `utils/` | כל השאר. אין תיקיית middlewares נפרדת |

- מבנה שטוח לפי סוג קובץ, לא לפי feature.
- התחומים (domains): `auth`, `rooms`, `events`, `alerts`, `stats`.
- אין `cors`: הפרונט והשרת יושבים באותה כתובת (בפיתוח דרך ה-proxy של Vite).

---

## 3. שמות

| מה | כלל | דוגמה |
|---|---|---|
| קבצי routes | `<domain>.routes.js` | `rooms.routes.js` |
| קבצי services | `<domain>.service.js` (תמיד יחיד) | `events.service.js` |
| קבצי repositories | `<domain>.repo.js` | `events.repo.js` |
| קבצי sockets | `<name>.socket.js` | `listener.socket.js`, `live.socket.js` |
| קבצי utils | `camelCase.js`, השם = הפונקציה המיוצאת | `generateToken.js` |
| פונקציות | פועל + ישות | `getRoomById`, `createEvent` |
| middlewares | `<name>Middleware` | `authMiddleware`, `adminMiddleware` |
| אובייקט מיוצא | `<domain>Service` / `<domain>Repo` | `export const eventsService = {` |
| router | `router` ביצוא, `router as <domain>Router` בייבוא | `import { router as roomsRouter } from './routes/rooms.routes.js';` |
| zod schemas | `<action><Entity>Schema` | `createEventSchema`, `loginSchema` |
| משתני סביבה | `UPPER_SNAKE_CASE` | `MONGO_URI`, `SECRET_KEY` |
| תפקידים | `'admin'`, `'viewer'` | – |

---

## 4. שכבות וזרימה

HTTP: `app.js` → `routes` (+ middlewares) → `services` → `repositories` → `db`
socket: `server.js` → `sockets` → `services` → `repositories` → `db`

| שכבה | מה היא עושה | מה אסור לה |
|---|---|---|
| `routes` | קוראת `req.params` / `req.query` / `req.body`, קוראת ל-service, שולחת `res.json(...)` (ו-`res.status(201)` ביצירה) | לוגיקה עסקית, ולידציה, גישה למסד |
| `sockets` | קוראת את ההודעה ואת `socket.data`, קוראת ל-service, מחזירה אישור ב-callback | לוגיקה עסקית, ולידציה, גישה למסד |
| middlewares | בדיקות הרשאה, קריאה ל-services | שליחת תשובה. או `throw` או `next()` |
| `services` | `validateSchema`, כללים עסקיים, hash לסיסמה, שגיאות עם `status`, המרת צורת המסמך | `req`/`res`, גישה ישירה למסד |
| `repositories` | קריאות ל-driver בלבד | ולידציה, שגיאות HTTP, שינוי צורת המסמך |

handler של route:

```js
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const room = await roomsService.getRoomById(id);

  res.json(room);
});
```

handler של socket:

```js
socket.on(LISTENER_EVENT, async (data, ack) => {
  try {
    await eventsService.createEvent(data, socket.data.device);
    ack({ success: true });
  } catch (error) {
    ack({ success: false, message: error.message });
  }
});
```

ב-socket זה ה-`try/catch` היחיד שמותר מחוץ ל-`db`, כי אין שם `errorHandler` של Express שיתפוס את השגיאה.

- services ו-repositories: `async function` רגילות, ובסוף הקובץ אובייקט אחד: `export const eventsService = { createEvent, getEvents };`.
- middlewares ו-utils: `export function` / `export async function` על הפונקציה עצמה.

---

## 5. ולידציה ושגיאות

- כל ה-schemas בקובץ אחד: `src/utils/validation.js`. גם הסכמות של החוזה (סעיף 9).
- הוולידציה בתחילת פונקציית ה-service: `validateSchema(createEventSchema, eventData);`.
- `validateSchema` זורק שגיאה עם `status = 400` והודעת הבעיה הראשונה מ-zod, ומחזיר את `result.data`.
- יצירת שגיאה בשלוש שורות, בלי class ובלי helper:

```js
const error = new Error('Room not found!');
error.status = 404;
throw error;
```

| סטטוס | מתי |
|---|---|
| 400 | ולידציה |
| 401 | טוקן חסר, טוקן לא תקין או שפג תוקפו, סיסמה שגויה |
| 403 | המשתמש מחובר אבל אין לו הרשאה |
| 404 | לא נמצא |
| 409 | אימייל תפוס |

- `errorHandler` יחיד ב-`utils/errorHandler.js`, **עם 4 פרמטרים** `(err, req, res, next)`, אחרת Express לא מזהה אותו. מחזיר `res.status(status).json({ message })`, ובשגיאה בלי `status` מחזיר 500 עם `'Internal server error!'`.
- נתיב לא קיים: `res.status(404).json({ message: \`${req.url} doesn't have ${req.method} method!\` })`.

---

## 6. מבנה התשובה

- אין מעטפת. מחזירים ישירות את האובייקט או המערך: `res.json(rooms);`.
- יצירה: `res.status(201).json(created)`. מחיקה: מחזירים את מה שנמחק.
- שגיאה: `{ message }`.
- אישור קבלה ב-socket: `{ success: true }` או `{ success: false, message }` (חלק מהחוזה).
- הלקוח לא רואה `_id`, `password_hash`, `key_hash` או שמות עמודות ב-snake_case. ההמרה נעשית ב-service.

---

## 7. גישה למסדים

### Supabase (PostgreSQL)

- `db/supabase.js` יוצר client אחד עם `SUPABASE_URL` ו-`SUPABASE_SERVICE_ROLE_KEY`, ומייצא אותו.
- repository:

```js
async function createEvent(row) {
  const { data, error } = await supabase
    .from('events')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: true })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
```

- ה-repository מחזיר את השורה כמו שהיא (snake_case). ה-service ממיר: `startedAt: row.started_at`.
- שמירת אירוע + התראה יחד: פונקציית PostgreSQL אחת ב-`sql/`, שה-repository קורא לה עם `supabase.rpc(...)`.

### MongoDB

- ה-driver הרשמי. `db/mongo.js` שומר חיבור יחיד (`let client, db;`) ומייצא `connectToDb()`.
- בכל repo: `getCollection()` פנימית, וכל פונקציה פותחת ב-`const collection = await getCollection();`.
- `find(filter).toArray()`, `findOne`, `insertOne`, `findOneAndUpdate` עם `{ $set: ... }` ו-`{ returnDocument: 'after' }`, `findOneAndDelete`.
- ב-service: `const { _id, ...rest } = doc; return { id: _id.toString(), ...rest };`.
- מסמכים שמקושרים לאירוע (`eventFeatures`, `spectrogramSnapshots`) שומרים את ה-`id` של האירוע בשדה `eventId`.

### משתני סביבה

- `import 'dotenv/config';` הוא ה-import הראשון ב-`server.js`.
- `process.env.X` בנקודת השימוש. אין קובץ config מרכזי.
- כל משתנה חדש נכנס ל-`.env.example` עם ערך ריק.

---

## 8. אימות והרשאות

- JWT קצר ב-cookie בשם `token` (15 דקות), ו-refresh token ב-cookie בשם `refreshToken` (7 ימים). שניהם `httpOnly: true, sameSite: 'lax'`. `POST /api/auth/refresh` מנפיק `token` חדש. ההצעה מתחייבת לזה.
- ה-payload: `{ userId }`. `authMiddleware` מוצא את המשתמש ושם אותו ב-`req.user`.
- `jwt.verify` עטוף ב-`try/catch` בתוך `authMiddleware`, וכשל זורק 401. בלי זה טוקן שגוי מחזיר 500.
- סיסמאות: `bcrypt.hash(password, 12)`, עמודה `password_hash`, השוואה עם `bcrypt.compare`.
- נתיב של מנהל: תמיד `authMiddleware` ואחריו `adminMiddleware`.
- `authMiddleware` ברמת ה-router (`router.use(authMiddleware);`) כשכל הנתיבים מוגנים, ובנתיב בודד כשרק חלקם.
- `express-rate-limit` על `/api/auth`.
- **מכשיר מאזין** מתחבר ל-socket עם מפתח מכשיר ב-`socket.handshake.auth.deviceKey`. ה-middleware של socket.io משווה את הגיבוב שלו ל-`devices.key_hash`, ושם את המכשיר ב-`socket.data.device`. `deviceId` ו-`roomId` של אירוע נלקחים משם, אף פעם לא מגוף ההודעה.

---

## 9. החוזה עם המאזין

- הטיפוסים בפרונט (`public/types/event.ts`) והסכמות בשרת (`src/utils/validation.js`) מתארים את אותן הודעות. שינוי באחד מחייב שינוי בשני באותו commit, ושני השותפים מאשרים.
- שמות אירועי socket רק ב-`src/utils/socketEvents.js` (ובמקביל `public/utils/socketEvents.ts`). לא כותבים שם של אירוע כמחרוזת בקוד.
- `listener:` מהמאזין לשרת, `live:` מהשרת לצופים.
- אירוע עם `id` שכבר קיים לא נשמר שוב, ובכל זאת מקבל `{ success: true }`. כך שליחה חוזרת אחרי ניתוק לא יוצרת כפילות, והמאזין מוחק אותו מהתור.

---

## 10. בדיקות ו-Git

- בדיקות יחידה ב-Vitest, ב-`tests/unit/<domain>.service.test.js`. ה-repositories מוחלפים ב-`vi.mock`.
- חובה לפי ההצעה: ולידציה של אירוע (`events.service`), טוקן שפג תוקפו (`auth`), התאמת אירוע לכלל (`alerts.service`).
- `main` יציב, `dev` לאינטגרציה, `feature/<משימה>` לכל משימה. כל שינוי דרך PR אל `dev`, והשותף מאשר.
- commits קטנים, הודעה באנגלית שמתחילה בפועל: "Added…", "Fixed…", "Updated…".

---

## 11. מה לא להעתיק מ-tzofia-eye

אלה דברים מהפרויקט הקודם שנראים כמו סגנון אבל הם באגים או שאריות:

- `errorHandler` עם 3 פרמטרים (צריך 4).
- `jwt.verify` בלי `try/catch`.
- `req.query` שעובר ישירות כ-filter למסד. בונים filter רק מהשדות המותרים.
- קריאה ל-service בלי `await`.
- `console.log` שנשארו בקוד, imports שלא בשימוש, משתנים שלא בשימוש.
- שדות סיסמה עם `type="text"`.
