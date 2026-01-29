# بوت تحميل تيك توك (TikTok Downloader Bot)

بوت تيليجرام لتحميل فيديوهات وصور تيك توك بدون علامة مائية.

## المميزات

✅ تحميل فيديوهات تيك توك بدون علامة مائية
✅ تحميل صور تيك توك (Slideshow)
✅ استخراج الصوت من الفيديوهات
✅ فصل الصوت عن الفيديو
✅ إضافة صوت للفيديو
✅ دعم لغات متعددة (قريباً)

## المتطلبات

- Node.js (الإصدار 14 أو أحدث)
- FFmpeg (للمعالجة الصوتية والفيديو)

## التثبيت

1. قم بتنزيل المشروع:
```bash
git clone [رابط المشروع]
cd New folder (8)
```

2. قم بتثبيت الحزم المطلوبة:
```bash
npm install
```

3. تأكد من تثبيت FFmpeg على جهازك:
- Windows: قم بتحميل FFmpeg من [الموقع الرسمي](https://ffmpeg.org/download.html)
- Linux: `sudo apt-get install ffmpeg`
- Mac: `brew install ffmpeg`

4. قم بتعديل مسار FFmpeg في الملف `index_tiktok_only.js` إذا لزم الأمر:
```javascript
ffmpeg.setFfmpegPath('مسار ffmpeg.exe');
ffmpeg.setFfprobePath('مسار ffprobe.exe');
```

## الإعداد

1. احصل على توكن البوت من [BotFather](https://t.me/botfather) على تيليجرام
2. استبدل التوكن في الملف `index_tiktok_only.js`:
```javascript
const BOT_TOKEN = 'توكن_البوت_الخاص_بك';
```

3. قم بإنشاء قناة على تيليجرام للاشتراك الإجباري
4. استبدل معرف القناة في الملف `index_tiktok_only.js`:
```javascript
const CHANNEL_ID = '@اسم_القناة';
```

## التشغيل

### على جهازك المحلي:

```bash
node index_tiktok_only.js
```

### على Render (للتشغيل المستمر 24/7):

1. رفع المشروع على GitHub
2. إنشاء حساب على [Render](https://render.com)
3. إنشاء Web Service جديد من GitHub
4. إضافة المتغيرات البيئية في إعدادات Web Service:
   - `BOT_TOKEN`: توكن البوت
   - `CHANNEL_ID`: معرف القناة للاشتراك الإجباري
   - `FFMPEG_PATH`: /usr/bin/ffmpeg
   - `FFPROBE_PATH`: /usr/bin/ffprobe
5. النقر على "Create Web Service"

## الاستخدام

1. ابدأ المحادثة مع البوت عن طريق إرسال `/start`
2. اشترك في القناة المطلوبة
3. أرسل رابط فيديو تيك توك
4. اختر الخيار المناسب من القائمة:
   - إرسال الفيديو
   - إرسال الصوت فقط
   - فصل الصوت عن الفيديو
   - إضافة صوت للفيديو

## المطور

- المطور: @AMZOZT
- القناة: https://t.me/A_Tech0

## الدعم

في حالة وجود أي مشكلة، تواصل مع المطور: @AMZOZT

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الشخصي والتجاري.
