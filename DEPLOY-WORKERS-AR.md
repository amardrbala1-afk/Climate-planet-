# نشر نسخة كوكب المناخ باستخدام Cloudflare Workers المرتبط بـ GitHub

هذا الأرشيف معد خصيصًا لمشروع Workers الحالي المسمى `mute-silence-5660`.

1. فك ضغط ملف ZIP ثم ارفع محتويات المجلد إلى **جذر** مستودع GitHub المرتبط بالمشروع (بدون مجلد خارجي). لا ترفع ملف ZIP نفسه كمرفق.
2. تحقق من ظهور `package.json` و`wrangler.jsonc` وملفات `site/` و`content/` و`data/` و`scripts/` في جذر المستودع.
3. من Cloudflare افتح المشروع `mute-silence-5660` ثم `Settings` ثم `Build` أو `Builds`.
4. اضبط **Build command** على `npm run build`، و**Deploy command** على `npx wrangler deploy`، و**Root directory** على جذر المستودع.
5. عند دفع commit إلى فرع النشر الأساسي `main` سيبدأ البناء والنشر تلقائيًا. راجع تبويب Builds/Deployments لحالة النشر.
6. افتح رابط `workers.dev` الموجود في لوحة المشروع للتحقق من ظهور الصفحة الرئيسية.

**تنبيه:** اسم `mute-silence-5660` يجب أن يطابق اسم الـWorker في Cloudflare. إذا تغيّر الاسم، عدّل قيمة `name` في `wrangler.jsonc` لتطابقه.

**المحتوى:** المقالات الثلاثة تعليمية/تجريبية، والأرشيف فارغ، والصور الجوية التوضيحية ليست توقعات حقيقية.
