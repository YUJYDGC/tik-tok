# بوت تحميل تيك توك

بوت تيليجرام لتحميل فيديوهات وصور تيك توك بدون علامة مائية، مع أدوات متعددة للمعالجة.

## المميزات

✅ تحميل فيديوهات تيك توك بدون علامة مائية
✅ تحميل صور تيك توك
✅ فصل الصوت عن الفيديو
✅ دمج صوت مع الفيديو
✅ استخراج الصوت فقط

## المتطلبات

- Node.js (الإصدار 14 أو أحدث)
- FFmpeg (مثبت على النظام)

## التثبيت والتشغيل

### على جهازك المحلي:

1. تثبيت الحزم المطلوبة:
```bash
npm install
```

2. إنشاء ملف `.env` وإضافة المتغيرات التالية:
```
BOT_TOKEN=your_bot_token_here
CHANNEL_ID=@your_channel_id
FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
FFPROBE_PATH=C:\ffmpeg\bin\ffprobe.exe
```

3. تشغيل البوت:
```bash
npm start
```

### على Render:

1. رفع المشروع على GitHub
2. إنشاء حساب على [Render](https://render.com)
3. إنشاء Web Service جديد من GitHub
4. إضافة المتغيرات البيئية في إعدادات Web Service:
   - `BOT_TOKEN`: توكن البوت
   - `CHANNEL_ID`: معرف القناة للاشتراك الإجباري
   - `FFMPEG_PATH`: /usr/bin/ffmpeg
   - `FFPROBE_PATH`: /usr/bin/ffprobe
5. النقر على "Create Web Service"

## ملاحظات

- البوت يتطلب اشتراكاً إجبارياً في قناة معينة للاستخدام
- يمكن تخصيص القناة من خلال متغير `CHANNEL_ID` في ملف `.env`
