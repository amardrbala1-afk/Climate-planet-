import json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
# Arabic city label, English GeoNames name, ISO country code, latitude, longitude
rows='''
دمشق|Damascus|SY|33.5138|36.2765
حلب|Aleppo|SY|36.2021|37.1343
حمص|Homs|SY|34.7324|36.7137
حماة|Hama|SY|35.1318|36.7578
اللاذقية|Latakia|SY|35.5317|35.7901
طرطوس|Tartus|SY|34.8959|35.8867
إدلب|Idlib|SY|35.9306|36.6339
دير الزور|Deir ez-Zor|SY|35.3359|40.1408
الرقة|Ar Raqqah|SY|35.9496|39.0079
الحسكة|Al Hasakah|SY|36.5024|40.7477
القامشلي|Qamishli|SY|37.0520|41.2220
درعا|Daraa|SY|32.6189|36.1021
السويداء|As Suwayda|SY|32.7089|36.5695
القنيطرة|Quneitra|SY|33.1259|35.8246
جبلة|Jableh|SY|35.3631|35.9257
بانياس|Baniyas|SY|35.1819|35.9487
صافيتا|Safita|SY|34.8209|36.1172
مصياف|Masyaf|SY|35.0646|36.3415
السلمية|Salamiyah|SY|35.0113|37.0530
تدمر|Palmyra|SY|34.5597|38.2678
منبج|Manbij|SY|36.5281|37.9549
الباب|Al Bab|SY|36.3705|37.5157
أعزاز|Azaz|SY|36.5866|37.0457
عفرين|Afrin|SY|36.5119|36.8698
جرابلس|Jarabulus|SY|36.8164|38.0111
سراقب|Saraqib|SY|35.8645|36.8059
معرة النعمان|Maarrat al-Numan|SY|35.6478|36.6760
جسر الشغور|Jisr ash-Shughur|SY|35.8143|36.3205
دوما|Douma|SY|33.5718|36.4027
داريا|Darayya|SY|33.4560|36.2315
النبك|An Nabk|SY|34.0240|36.7268
يبرود|Yabroud|SY|33.9670|36.6577
الزبداني|Az Zabadani|SY|33.7249|36.1005
المالكية|Al Malikiyah|SY|37.1771|42.1409
رأس العين|Ras al-Ayn|SY|36.8506|40.0707
البوكمال|Al Bukamal|SY|34.4523|40.9186
الميادين|Al Mayadin|SY|35.0199|40.4535
عمّان|Amman|JO|31.9539|35.9106
إربد|Irbid|JO|32.5556|35.8500
الزرقاء|Zarqa|JO|32.0728|36.0879
الرصيفة|Russeifa|JO|32.0170|36.0460
السلط|As Salt|JO|32.0392|35.7272
مادبا|Madaba|JO|31.7197|35.7939
جرش|Jerash|JO|32.2769|35.8993
عجلون|Ajloun|JO|32.3333|35.7520
المفرق|Mafraq|JO|32.3429|36.2080
الكرك|Karak|JO|31.1854|35.7047
الطفيلة|Tafilah|JO|30.8375|35.6044
معان|Maan|JO|30.1949|35.7342
العقبة|Aqaba|JO|29.5321|35.0063
الرمثا|Ar Ramtha|JO|32.5587|36.0082
الحصن|Al Husn|JO|32.4831|35.8724
بني كنانة|Bani Kinanah|JO|32.5889|35.8801
الشونة الشمالية|Ash Shunah ash Shamaliyah|JO|32.6136|35.6139
الأزرق|Azraq|JO|31.8329|36.8275
وادي موسى|Wadi Musa|JO|30.3222|35.4803
الشوبك|Shobak|JO|30.5269|35.5625
الرويشد|Ruwaished|JO|32.5014|38.2018
عمان الغربية|West Amman|JO|31.9843|35.8560
بيروت|Beirut|LB|33.8938|35.5018
طرابلس|Tripoli|LB|34.4367|35.8497
صيدا|Sidon|LB|33.5571|35.3729
صور|Tyre|LB|33.2705|35.2038
زحلة|Zahle|LB|33.8463|35.9020
جبيل|Byblos|LB|34.1236|35.6516
جونية|Jounieh|LB|33.9808|35.6178
بعلبك|Baalbek|LB|34.0058|36.2181
النبطية|Nabatieh|LB|33.3772|35.4838
عاليه|Aley|LB|33.8063|35.5972
الشوف|Chouf|LB|33.7010|35.5830
بشري|Bsharri|LB|34.2507|36.0105
البترون|Batroun|LB|34.2553|35.6589
الهرمل|Hermel|LB|34.3943|36.3860
راشيا|Rashaya|LB|33.4960|35.8457
بيت الدين|Beiteddine|LB|33.6941|35.5810
مرجعيون|Marjayoun|LB|33.3598|35.5911
القدس|Jerusalem|PS|31.7683|35.2137
غزة|Gaza|PS|31.5017|34.4668
الخليل|Hebron|PS|31.5326|35.0998
نابلس|Nablus|PS|32.2211|35.2544
رام الله|Ramallah|PS|31.9038|35.2034
بيت لحم|Bethlehem|PS|31.7054|35.2024
جنين|Jenin|PS|32.4594|35.3009
طولكرم|Tulkarm|PS|32.3103|35.0286
قلقيلية|Qalqilya|PS|32.1896|34.9706
أريحا|Jericho|PS|31.8560|35.4630
رفح|Rafah|PS|31.2969|34.2435
خان يونس|Khan Yunis|PS|31.3462|34.3063
دير البلح|Deir al-Balah|PS|31.4165|34.3511
بيت حانون|Beit Hanoun|PS|31.5360|34.5350
بيت لاهيا|Beit Lahiya|PS|31.5464|34.4951
سلفيت|Salfit|PS|32.0837|35.1812
طوباس|Tubas|PS|32.3209|35.3697
البيرة|Al Bireh|PS|31.9100|35.2167
يافا|Jaffa|PS|32.0534|34.7522
حيفا|Haifa|PS|32.7940|34.9896
عكا|Acre|PS|32.9270|35.0818
الناصرة|Nazareth|PS|32.6996|35.3035
صفد|Safed|PS|32.9646|35.4960
طبريا|Tiberias|PS|32.7922|35.5312
'''.strip().splitlines()
res=[]
for i,row in enumerate(rows):
 ar,en,code,lat,lon=row.split('|');res.append(dict(id=f'seed-{i+1}',ar=ar,name=en,country=code,lat=float(lat),lon=float(lon),source='seed'))
(root/'data').mkdir(exist_ok=True)
(root/'data'/'cities-seed.json').write_text(json.dumps(res,ensure_ascii=False,indent=2),encoding='utf8')
(root/'data'/'cities.json').write_text(json.dumps(res,ensure_ascii=False,indent=2),encoding='utf8')
print('Seed cities:',len(res))
