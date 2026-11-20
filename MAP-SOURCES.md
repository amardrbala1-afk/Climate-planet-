# مصادر الخرائط والتوثيق — Climate Planet V5

## الخلفيات
- Europe base: الصورة الأصلية المرفوعة في المحادثة `2026114GLIBAL.png` (3704×2706). نسخة WebP مطابقة من حيث التكوين الهندسي دون أي استبدال.
- Levant base: الصورة الأصلية المرفوعة في المحادثة `2026511.png` (4756×2555). نسخة WebP مشتقة من نفس الصورة.
- ملفات PNG لا تحمل georeferencing في حد ذاتها؛ المعايرة بنقاط مرجعية محققة إلزامية قبل إسقاط أي حقل عددي.

## النماذج والبيانات
- NOAA National Centers for Environmental Prediction, NOMADS: https://nomads.ncep.noaa.gov/ — GFS 0.25°, GRIB2 filter https://nomads.ncep.noaa.gov/gribfilter.php?ds=gfs_0p25 . يجب فحص زمن تشغيل النموذج والمدة التراكمية في رسائل GRIB.
- ECMWF Open Data: https://www.ecmwf.int/en/forecasts/datasets/open-data ; توثيق API: https://www.ecmwf.int/en/forecasts/datasets/open-data — تتوفر حقول مفتوحة محددة، تختلف المدد والمتغيرات عند تحديث السياسة.
- DWD Open Data: https://opendata.dwd.de/weather/nwp/ — تحقق من التغطية والحقول وحقوق النشر لكل حزمة.
- Natural Earth: https://www.naturalearthdata.com/about/terms-of-use/ ، بيانات الملك العام. ملف `tools/land/ne-110m-land.geojson` قناع بري احتياطي مشتق من Natural Earth.

## خط المعالجة
1. تنزيل ملفات البيانات من موفّرها وتسجيل Run UTC، variable، level، interval، source.
2. تحويل/فحص الحقول في CSV قبل العرض، والتحقق من وحدات Kelvin/°C وارتفاعات gp/gpm/dam، وتصحيح قيم الهطول التراكمي.
3. تحديد مواقع الربط على الخريطة باستخدام `site/tools/map-calibration.html` وحفظ نقاط التحكم الجغرافي. يعرض `render_map.py` RMSE ويرفض الخرائط خارج عتبة الخطأ.
4. إخراج صورة شفافة؛ حقول t850 وt2m والمطر على اليابسة فقط من خلال فصل الألوان في خريطة الخلفية، مع حقول 500 hPa فوق اليابسة والبحر.
5. ملف catalog يشير إلى كل صورة ومصدر ووقت وتوقع ووحدة. يبدأ `catalog.json` فارغًا؛ **لا تتضمن الحزمة توقعًا جويًا حقيقيًا لوقت محدد**.

## تقييد إعادة النشر
- تجنب نسخ صور Météociel أو قواعد بيانات محمية بلا ترخيص؛ الاستفادة من بيانات النماذج الأصلية أو روابط واضحة فقط.
- عند استخراج بيانات NOAA وECMWF/DWD تحقق من آخر شروط إعادة النشر ونسب المصدر.
- Open-Meteo المجاني مخصص للاستخدام غير التجاري في خطته المفتوحة؛ تفاصيل https://open-meteo.com/en/terms .
- تصنيفات طقس/هطول ولوحات جذابة لا تعني موثوقية الإخراج تلقائيًا. مراجعة بشرية وعلمية مطلوبة قبل نشر أي خرائط مؤثرة.
