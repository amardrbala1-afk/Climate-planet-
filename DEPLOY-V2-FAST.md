# تحديث كوكب المناخ V2 للمشروع الموجود

1. فك ضغط `Kawkab_AlMonakh_V2_GitHub_Workers_Source.zip`.
2. استبدل ملفات مشروع GitHub الحالي بمحتويات الحزمة **مع الإبقاء على الملفات والمجلدات بالمسارات نفسها**، ثم commit إلى فرع Cloudflare المرتبط.
3. في مشروع `mute-silence-5660` على Cloudflare Workers، لا تنشئ مشروعًا ثانيًا.
4. إعدادات البناء: `npm run build`، النشر: `npx wrangler deploy`.
5. راقب سجل النشر. افتح رابط `https://mute-silence-5660.amardrbala1.workers.dev` إذا بقي نفس الاسم والرابط، وتحقق من علامات التبويب.
6. إذا كانت لديك محتويات مخصصة في V1 تحت `content/` أو `site/images/uploads/`, **ادمجها بدل حذفها** عند الاستبدال.

للتفاصيل والقيود والترخيص: اقرأ `README-V2-AR.md`.
