# UltraGuard: עקרונות כתיבת קוד

המסמך הזה מחייב את שנינו ואת כל כלי AI שכותב קוד לפרויקט. מעבירים אותו לכלי בתחילת כל שיחה.
שינוי במסמך נכנס רק דרך PR ששנינו מאשרים.

## כלל העל

מותר להשתמש ב-AI בחופשיות, אבל כל אחד מאיתנו חייב להכיר ולהסביר כל שורה בפרויקט (חוץ מקוד פנימי של ספריות).
לכן:

- קוד פשוט וקריא עדיף על קוד חכם וקצר.
- לא מכניסים קוד שלא מבינים. אם ה-AI כתב משהו לא ברור, מבקשים הסבר או גרסה פשוטה יותר.
- לא מוסיפים ספרייה חדשה בלי הסכמה של שנינו.
- לא משנים קבצים מחוץ למשימה שעליה עובדים.

## כללי

- גרסאות עדכניות בלבד של React, Node וכל הספריות.
- קוד פשוט, בלי תבניות מתקדמות שהפרויקט לא באמת צריך.
- `async/await` ולא `.then/.catch`.
- בלי הערות בקוד, חוץ ממקרה שבאמת צריך הסבר (למשל נוסחה של עיבוד אותות).
- שמות קוד באנגלית. טקסט שהמשתמש רואה בעברית.
- המונח לתוכנה שמאזינה במכשיר הוא **listener** (לא agent), בכל מקום: קוד, קבצים ותיעוד.

## מבנה התיקיות

```
public/                 # פרונט, React + TypeScript, שורש של Vite
  types/                # טיפוסים, קובץ לכל ישות
  api/                  # בקשות axios בלבד, קובץ לכל תחום
  store/                # Zustand, קובץ לכל תחום, קורא ל-api
  components/           # רכיבים שמקבלים props בלבד
  pages/                # עמודים שמחוברים ל-store
  routes/               # הגדרת נתיבים והגנה עליהם
  listener/             # המאזין: קליטה, עיבוד אותות, גילוי, סיווג, שליחה. בלי React
  utils/                # פונקציות עזר טהורות
  styles/
src/                    # בק, Node.js + Express. המבנה המלא ב-BACKEND.md
  routes/  sockets/  services/  repositories/  utils/  db/
  sockets/              # הודעות socket.io, מקביל ל-routes + ctrls
  utils/                # סכמות zod, טיפול שגיאות, JWT
  db/                   # חיבור ל-Supabase ול-MongoDB
sql/                    # טבלאות, RLS ופונקציות של Supabase
python-listener/        # מאזין אופציונלי ב-Python
tests/                  # unit/ (Vitest), e2e/ (Playwright)
```

התחומים (domains) בבק: `auth`, `rooms`, `events`, `alerts`, `stats`. קובץ לכל תחום בכל שכבה.

## Frontend: קומפוננטות

- arrow function עם `export default` בסוף הקובץ.
- ה-props מוגדרים ב-`interface` מעל הקומפוננטה, בשם `<Name>Props`.
- callback ב-interface מחזיר תמיד `void` ולא `Promise`: `onDelete: (id: string) => void`.
- קומפוננטה ב-`components/` לא ניגשת ל-store. היא מקבלת נתונים ופעולות ב-props.
- עמוד ב-`pages/` קורא מה-store ומעביר למטה.
- טופס אחד משמש גם להוספה וגם לעריכה, עם `fieldValue` ו-`buttonText` ב-props.
- ולידציה בפונקציה נפרדת מעל הקומפוננטה, שמחזירה אובייקט שגיאות.
- טיפול באירוע בפונקציה בשם `handle<Action>`: `handleSubmit`, `handleLogout`.
- בלי טיפוסי אירועים מיותרים שגרסאות חדשות של React לא צריכות.

## Frontend: api ו-store

- כל בקשות הרשת נמצאות ב-`api/`. פונקציה שם שולחת בקשה ומחזירה את ה-`data`, בלי state.
- `axios` רגיל עם `BASE_URL` קבוע בראש הקובץ, בלי `axios.create`.
- הטוקן מצורף דרך פונקציה אחת (`getAuth()`) שמועברת כפרמטר אחרון לבקשה.
- בכל store יש `isLoading` ו-`error`, וכל פעולה אסינכרונית בנויה אותו דבר:
  - בהתחלה `set({ isLoading: true, error: null })`.
  - `try` עם הקריאה ל-api ועדכון ה-state.
  - `catch` עם `getErrorDetails(err, "הודעת ברירת מחדל")`.
- קריאה מה-store עם selector נפרד לכל ערך: `useEventsStore((state) => state.events)`.
- כל הפעולות ב-interface של ה-store מחזירות `void`.
- `react-router-dom` לניווט.

## Frontend: שמות

| מה | כלל | דוגמה |
| --- | --- | --- |
| קומפוננטה וקובץ שלה | PascalCase | `EventCard.tsx` |
| עמוד | מסתיים ב-`Page` | `DashboardPage`, `AdminPage` |
| store | camelCase ומסתיים ב-`Store` | `eventsStore.ts`, `useEventsStore` |
| קובץ api | תחום + `.api.ts` | `events.api.ts` |
| טעינה או שמירה ב-store | מתחיל ב-`set` | `setEvents`, `setNewRoom`, `setUpdateRoom`, `setSelectedEvent` |
| מחיקה ב-store | מתחיל ב-`remove` | `removeRoom`, `removeUser` |
| טיפוס או interface | PascalCase | `EventInput`, `RoomFormValues`, `RoomFormErrors` |
| קבוע | UPPER_SNAKE | `BASE_URL`, `HEARTBEAT_MS` |
| ניווט | `nav` | `const nav = useNavigate()` |
| class ב-CSS | kebab-case | `events-table`, `app-header` |

## Frontend: טיפוסים

- `type` לאיחוד של ערכים: `type EventType = "silverpush" | "lisnr" | ...`.
- `interface` לאובייקט.
- טיפוס נפרד לקלט בלי id (`RoomInput`), והישות המלאה מרחיבה אותו (`Room extends RoomInput`).
  חריגה אחת: `EventInput` כולל `id`, כי המאזין יוצר אותו כדי למנוע כפילויות בשליחה חוזרת.
- טיפוס נפרד לערכי הטופס, שבו המספרים הם מחרוזות (`RoomFormValues`).
- ייבוא טיפוסים עם `import type`.

## המאזין (`public/listener/`)

- בלי React ובלי store. ה-`listenerStore` מפעיל אותו ושומר את התוצאות, והעמוד קורא רק מה-store.
- `dsp.ts`, `detector.ts`, `classifier.ts` ו-`decoder.ts` הם פונקציות טהורות: מקבלות מספרים ומחזירות מספרים, בלי Web Audio. כך בודקים אותן ב-Vitest בלי דפדפן.
- רק `capture.ts` ו-`goertzel.worklet.ts` נוגעים במיקרופון ובאודיו.
- ה-worklet רץ ב-thread נפרד: לא מייבאים אליו כלום, ומתקשרים איתו רק דרך `port.postMessage`.
- לא מניחים קצב דגימה. תמיד משתמשים ב-`audioContext.sampleRate` (במחשבים שבדקנו הוא 44,100 ולא 48,000).
- המאזין שולח לשרת רק אירועים ומספרים, אף פעם לא אודיו.

## Backend

כל הקוד ב-`src/` נכתב לפי `BACKEND.md`, בסגנון של אבי. המסמך הזה (`CONVENTIONS.md`) חל על `public/` ועל `tests/` של הפרונט והמאזין.

כשמבקשים מכלי AI לכתוב קוד שרת, מצרפים את `BACKEND.md` ולא את המסמך הזה.

## החוזה בין המאזין לשרת

- `public/types/event.ts` ו-`src/utils/validation.js` מתארים את אותן הודעות. שינוי באחד מחייב שינוי בשני באותו commit, ושני השותפים מאשרים.
- שמות אירועי socket נמצאים רק ב-`socketEvents.ts` וב-`socketEvents.js`, זהים בשניהם. לא כותבים שם של אירוע כמחרוזת בקוד.
- `listener:` מהמאזין לשרת, `live:` מהשרת לצופים.

## בדיקות

- בדיקת יחידה נכתבת יחד עם המודול, לא בסוף. במיוחד `dsp`, `detector`, `classifier`, `decoder` וה-services.
- קובץ בדיקה בשם הקובץ הנבדק: `dsp.test.ts`, `events.service.test.js`.

## Git

- `main` יציב, `dev` לאינטגרציה, `feature/<משימה>` לכל משימה. לא דוחפים ישירות ל-`main` או ל-`dev`.
- כל שינוי נכנס דרך PR אל `dev`, והשותף מאשר. לא מאשרים PR שלא הבנו.
- ענף חי יום-יומיים, לא שבוע. לפני פתיחת PR מושכים את `dev` לתוך הענף.
- commits קטנים, כל אחד על שינוי אחד, עם הודעה באנגלית שמתחילה בפועל: "Added…", "Fixed…", "Updated…".
