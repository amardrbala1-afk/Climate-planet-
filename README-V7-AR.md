# 🌍 كوكب المناخ V7 — الخرائط العددية بإحداثيات حقيقية

## ما تم بناؤه فعليًا

- اعتماد الخرائط **الجديدة** التي قدّمها صاحب المشروع داخل الملفين المضغوطين، وليس خلفيات V5 القديمة.
- ملف أوروبا: `4500×5625` بكسل، ملف `eroba and sham and afreca.pgw`، محفوظ ضمن المشروع باسم `tools/georef/europe.pgw`.
- ملف بلاد الشام: `3240×4050` بكسل، ملف `blad alsham 2.pgw`، محفوظ باسم `tools/georef/levant.pgw`.
- عرض الخلفيتين بصيغة WebP مضغوطة بنفس أبعاد البكسلات الأصلية، للحفاظ على توافق ملف العالم وتخفيف حجم مستودع GitHub.
- **تنبيه علمي:** `.pgw` يحدد التحويل الأفيني، **ولا يحدد نظام الإحداثيات CRS**. تم استنتاج `EPSG:3857` من حدود الخرائط ومطابقة مواضع القدس ودمشق وباريس بصريًا؛ يجب التأكد من مشروع QGIS الأصلي إذا كان يحتاج استعمالًا مساحيًا رسميًا.
- مولّد خرائط GFS المصدّق يقرأ بيانات NOAA الرسمية (GRIB2)، يفحص اسم المتغير، مستوى الضغط، وقت تشغيل النموذج والفترة التراكمية قبل إنشاء صورة.
- `500 hPa` و`850 hPa` فوق خريطة أوروبا، وحرارة `2m` وتراكم المطر على خريطة بلاد الشام.
- المحافظة على اليابسة عند تلوين المطر، ومفتاح الألوان المعتمد، ورفض نشر المدخلات ناقصة التغطية.
- شريط حركة ساعات التوقع، ومقارنة تحديثين أو نموذجين **فقط إذا وُجدت صور منشورة لهما فعلًا**.
- تشغيل GitHub Actions مجدول مرتين يوميًا على توقيت UTC، ويدوي من صفحة Actions.
- الاحتفاظ بآخر ثلاثة تشغيلات صالحة لكل منتج بدل تضخم مستودع GitHub بمرور الوقت.
- بناء الموقع مع V6: بطاقات طقس المدن المخصصة، لعبتا الفضاء والأرصاد، أرشيف القدس، والموسوعة.

## الحالة الحقيقية عند تسليم الملفات

**بيانات التوقع الفعلية لم تُنزّل بعد في هذه الجلسة**؛ بيئة العمل الحالية لا تستطيع الوصول إلى خوادم NOAA بسبب قيود DNS. من ثم فإن `data/map-products/catalog.json` **فارغ** ولا تتضمن النسخة المرفوعة خريطة تنبؤية مزيفة. عند رفع المشروع إلى GitHub، شغّل Workflow المسمى `V7 · NOAA GFS georeferenced maps`، وهو المسؤول عن تنزيل GRIB وتحويله ونشر الصور إذا نجح التحقق.

## التشغيل

1. ارفع محتويات ملف `Kawkab_AlMonakh_V7_GitHub_Cloudflare_Source.zip` إلى مستودع GitHub (ليس ملف ZIP نفسه).
2. حافظ على إعداد Cloudflare `npm run build`، وأمر النشر `npx wrangler deploy`، ومجلد المشروع `/`.
3. افتح مستودع GitHub ثم `Actions`، واختر `V7 · NOAA GFS georeferenced maps` ثم `Run workflow`؛ اترك التاريخ والدورة فارغين لاستخدام المرشح الأحدث.
4. راقب سجلات العمل؛ إذا لم يتوفر تشغيل النموذج أو فشل التحقق، لن ينشر النظام خريطة بلا إثبات.
5. عندما ينجح العمل ويدفع الصور وفهرسها إلى المستودع، سيظهر المحتوى في مركز العمليات بعد نجاح نشر Cloudflare للنسخة المحدثة. قد يتطلب إعادة نشر يدوي إذا لم يلتقط Cloudflare دفعة GitHub Actions.
6. في GitHub Actions، لا بد من صلاحية `Read and write permissions` للـ `GITHUB_TOKEN` إذا رفض GitHub دفع التغييرات. اضبط ذلك فقط إذا كان متاحًا ومناسبًا لإعدادات أمان مستودعك.

## أوامر المطوّر

```bash
npm run build:offline
npm test
python tests/browser-v6-offline.py
python tests/browser-v7-offline.py
python tools/schedule_gfs.py --dry-run
python tools/publish_gfs.py --date 20261120 --cycle 00 --region europe --field z500 --forecast-hour 24 --dry-run
```

### تشغيل نشر واحد (عند توفر اتصال الإنترنت والحزم العلمية)

```bash
pip install -r tools/requirements-map-automation.txt
python tools/publish_gfs.py --date YYYYMMDD --cycle 00 --region europe --field z500 --forecast-hour 24
python tools/publish_gfs.py --date YYYYMMDD --cycle 00 --region europe --field t850 --forecast-hour 24
python tools/publish_gfs.py --date YYYYMMDD --cycle 00 --region levant --field t2m --forecast-hour 24
python tools/publish_gfs.py --date YYYYMMDD --cycle 00 --region levant --field rain --forecast-hour 6 --accum-hours 6
```

### لم يتم الوعد بما لم يكتمل

- **ECMWF/ICON**: يمكن عرض منتجاتهما المعتمدة في واجهة المقارنة إذا نُشرت في الفهرس، لكن خط تنزيلهما التلقائي **غير مفعّل في V7**. المسار المنفذ والمجدول خاص بـ **NOAA GFS**.
- التشغيل الحي والتحقق من ملف NOAA GRIB2 الفعلي يحتاج تنفيذ GitHub Action المتصل بالإنترنت؛ الاختبارات المحلية شملت مولّدًا مع بيانات **اختبار صناعية معزولة لا تُنشر**.
- خرائط القياس الزمني للمطر 6/12/18/24 ساعة لا تُشتق بالتخمين؛ يتم رفض أي فترة لا تطابق `GRIB_stepRange` الفعلي.
- عدد المدن المتاح يتبع `data/cities.json`؛ الاستيراد الشبكي الاختياري ليس ضمانًا لتوفّر ألف مدينة.
- تصاميم الخرائط تعكس بيانات النماذج ولا تعني يقين التوقع أو تحذيرًا رسميًا.

## البيانات والمراجع

- NOAA NOMADS: https://nomads.ncep.noaa.gov/
- نموذج GFS 0.25°: https://www.nco.ncep.noaa.gov/pmb/products/gfs/nomads/
- GRIB Filter: https://nomads.ncep.noaa.gov/info.php?page=gribfilter
- ECMWF Open Data: https://www.ecmwf.int/en/forecasts/datasets/open-data
- ملفات الصور والإسناد: قدمها صاحب مشروع كوكب المناخ؛ التوقعات والألوان المولَّدة لا تُنسب إلى مصدر غير متحقق منه.
