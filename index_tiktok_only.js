const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

// تحديد مسار FFmpeg بشكل صريح
const ffmpegPath = process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'C:\\ffmpeg\\bin\\ffmpeg.exe' : '/usr/bin/ffmpeg');
const ffprobePath = process.env.FFPROBE_PATH || (process.platform === 'win32' ? 'C:\\ffmpeg\\bin\\ffprobe.exe' : '/usr/bin/ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// التوكن والقناة من ملف .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const bot = new Telegraf(BOT_TOKEN);

const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

const userState = new Map();
const fileCache = new Map();

const UI_IMAGES = {
    welcome: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop'
};

// دالة للتحقق من اشتراك المستخدم في القناة
async function checkSubscription(ctx) {
    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
        if (['member', 'administrator', 'creator'].includes(member.status)) {
            return true;
        }
    } catch (e) {
        console.error('Subscription check error:', e);
    }
    return false;
}

// رسالة الاشتراك الإجباري
async function sendSubscriptionMessage(ctx) {
    return ctx.reply(`⚠️ عذراً، يجب عليك الاشتراك في القناة أولاً لاستخدام البوت!

يرجى الانضمام إلى القناة ثم الضغط على زر تأكيد الاشتراك بالأسفل.

🔗 القناة: ${CHANNEL_ID}`, {
        ...Markup.inlineKeyboard([
            [Markup.button.url('📢 انضم للقناة الآن', `https://t.me/${CHANNEL_ID.replace('@', '')}`)],
            [Markup.button.callback('✅ تأكيد الاشتراك', 'check_sub')]
        ])
    });
}

bot.start(async (ctx) => {
    const isSubscribed = await checkSubscription(ctx);
    if (!isSubscribed) return sendSubscriptionMessage(ctx);

    ctx.replyWithPhoto(UI_IMAGES.welcome, {
        caption: `🤖 بوت تحميل تيك توك

أهلاً بك يا ${ctx.from.first_name}!

✅ تيك توك: فيديوهات وصور بدون علامة مائية.
✅ أدوات: فصل الصوت، إضافة صوت، والمزيد!

أرسل رابط تيك توك الآن للبدء!`,
        ...Markup.keyboard([
            ['📥 تحميل وسائط', 'ℹ️ تعليمات'],
            ['📊 حالة السيرفر']
        ]).resize()
    });
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;

    const isSubscribed = await checkSubscription(ctx);
    if (!isSubscribed) return sendSubscriptionMessage(ctx);

    if (userState.has(userId) && userState.get(userId).action === 'awaiting_audio') {
        return ctx.reply('⚠️ يرجى إرسال ملف صوتي (Audio) أو بصمة صوتية.');
    }

    if (text.startsWith('http')) {
        return handleDownload(ctx, text);
    } else if (text === 'ℹ️ تعليمات') {
        return ctx.reply('أرسل رابط تيك توك وسأعطيك خيارات للتحميل والمعالجة.');
    } else if (text === '📊 حالة السيرفر') {
        return ctx.reply('السيرفر يعمل بكفاءة وجاهز لمعالجة ملفاتك 🚀');
    }
});

bot.on(['audio', 'voice'], async (ctx) => {
    const isSubscribed = await checkSubscription(ctx);
    if (!isSubscribed) return sendSubscriptionMessage(ctx);

    const userId = ctx.from.id;
    if (userState.has(userId) && userState.get(userId).action === 'awaiting_audio') {
        const state = userState.get(userId);
        const fileId = ctx.message.audio ? ctx.message.audio.file_id : ctx.message.voice.file_id;
        const statusMsg = await ctx.reply('⏳ جاري دمج الصوت مع الفيديو...');

        try {
            const audioUrl = await ctx.telegram.getFileLink(fileId);
            const audioPath = path.join(downloadDir, `temp_audio_${Date.now()}.mp3`);
            const outputPath = path.join(downloadDir, `merged_${Date.now()}.mp4`);

            const audioResponse = await axios({ url: audioUrl.href, responseType: 'stream' });
            const audioWriter = fs.createWriteStream(audioPath);
            audioResponse.data.pipe(audioWriter);
            await new Promise((res) => audioWriter.on('finish', res));

            ffmpeg(state.videoPath)
                .input(audioPath)
                .outputOptions(['-c:v copy', '-c:a aac', '-map 0:v:0', '-map 1:a:0', '-shortest'])
                .save(outputPath)
                .on('end', async () => {
                    await ctx.replyWithVideo({ source: outputPath }, { caption: '✅ تم دمج الصوت مع الفيديو بنجاح!' });
                    userState.delete(userId);
                    [audioPath, outputPath].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
                    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
                })
                .on('error', (err) => {
                    console.error(err);
                    ctx.reply('❌ حدث خطأ أثناء دمج الصوت.');
                });
        } catch (e) {
            ctx.reply('❌ فشل تحميل الملف الصوتي.');
        }
    }
});

async function handleDownload(ctx, url) {
    const statusMsg = await ctx.reply('🔍 جاري تحليل الرابط...');
    const timestamp = Date.now();
    const fileId = `media_${timestamp}`;
    const filePath = path.join(downloadDir, `${fileId}.mp4`);

    try {
        let downloadUrl = '';
        let isImage = false;
        let images = [];

        if (url.includes('tiktok.com')) {
            try {
                const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                const data = response.data.data;
                if (data.images) {
                    isImage = true;
                    images = data.images;
                } else {
                    downloadUrl = data.play;
                }
            } catch (err) {
                console.error('TikTok API error:', err.message);
                throw new Error('فشل في تحميل من تيك توك');
            }
        } else {
            throw new Error('الرابط غير مدعوم حالياً - هذا البوت مخصص لتيك توك فقط');
        }

        if (isImage) {
            if (images.length > 0) {
                const mediaGroup = images.map(img => ({ type: 'photo', media: img }));
                for (let i = 0; i < mediaGroup.length; i += 10) {
                    await ctx.replyWithMediaGroup(mediaGroup.slice(i, i + 10));
                }
            } else {
                await ctx.replyWithPhoto({ url: downloadUrl });
            }
            await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
        } else if (downloadUrl) {
            const writer = fs.createWriteStream(filePath);
            const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', timeout: 30000 });
            response.data.pipe(writer);
            await new Promise((res) => writer.on('finish', res));

            fileCache.set(fileId, filePath);

            await bot.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, '✅ تم تجهيز الفيديو! اختر ماذا تريد أن تفعل:', {
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🎬 إرسال الفيديو', `send_v:${fileId}`)],
                    [Markup.button.callback('🎵 إرسال الصوت', `send_a:${fileId}`)],
                    [Markup.button.callback('✂️ فصل الفيديو عن الصوت', `mute_v:${fileId}`)],
                    [Markup.button.callback('🎤 إضافة صوت للفيديو', `add_a:${fileId}`)],
                    [Markup.button.callback('🔙 رجوع / إلغاء', 'del')]
                ])
            });
        } else {
            throw new Error('No media found');
        }
    } catch (err) {
        console.error(err);
        await bot.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, `❌ فشل التحميل! ${err.message}`);
    }
}

bot.action('check_sub', async (ctx) => {
    const isSubscribed = await checkSubscription(ctx);
    if (isSubscribed) {
        await ctx.answerCbQuery('✅ شكراً لاشتراكك! يمكنك الآن استخدام البوت.');
        await ctx.deleteMessage();
        return ctx.reply('تم تفعيل البوت بنجاح! أرسل رابط تيك توك الآن.');
    } else {
        await ctx.answerCbQuery('❌ لم تشترك في القناة بعد!', { show_alert: true });
    }
});

bot.action(/send_v:(.+)/, async (ctx) => {
    const fileId = ctx.match[1];
    const filePath = fileCache.get(fileId);
    if (!filePath || !fs.existsSync(filePath)) return ctx.answerCbQuery('❌ الملف غير موجود.');
    await ctx.answerCbQuery('🚀 جاري إرسال الفيديو...');
    await ctx.replyWithVideo({ source: filePath });
});

bot.action(/send_a:(.+)/, async (ctx) => {
    const fileId = ctx.match[1];
    const filePath = fileCache.get(fileId);
    if (!filePath || !fs.existsSync(filePath)) return ctx.answerCbQuery('❌ الملف غير موجود.');
    await ctx.answerCbQuery('🎵 جاري استخراج وإرسال الصوت...');
    const audioPath = filePath.replace('.mp4', '.mp3');
    ffmpeg(filePath).toFormat('mp3').save(audioPath).on('end', async () => {
        await ctx.replyWithAudio({ source: audioPath });
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    });
});

bot.action(/mute_v:(.+)/, async (ctx) => {
    const fileId = ctx.match[1];
    const filePath = fileCache.get(fileId);
    if (!filePath || !fs.existsSync(filePath)) return ctx.answerCbQuery('❌ الملف غير موجود.');
    await ctx.answerCbQuery('✂️ جاري فصل الصوت عن الفيديو...');
    const mutedPath = filePath.replace('.mp4', '_muted.mp4');
    ffmpeg(filePath).outputOptions('-an').save(mutedPath).on('end', async () => {
        await ctx.replyWithVideo({ source: mutedPath }, { caption: '✅ تم فصل الصوت عن الفيديو.' });
        if (fs.existsSync(mutedPath)) fs.unlinkSync(mutedPath);
    });
});

bot.action(/add_a:(.+)/, async (ctx) => {
    const fileId = ctx.match[1];
    const filePath = fileCache.get(fileId);
    if (!filePath || !fs.existsSync(filePath)) return ctx.answerCbQuery('❌ الملف غير موجود.');
    userState.set(ctx.from.id, { action: 'awaiting_audio', videoPath: filePath });
    await ctx.reply('🎤 يرجى إرسال الملف الصوتي أو البصمة الصوتية الآن لدمجها مع الفيديو...');
    await ctx.answerCbQuery();
});

bot.action('del', (ctx) => {
    ctx.deleteMessage();
    ctx.answerCbQuery('تم الإلغاء.');
});

// إضافة معالجة للأخطاء العامة للبوت
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

// تشغيل البوت
bot.launch();
console.log('🚀 البوت يعمل الآن!');
