const fs = require('fs');
const https = require('https');

const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

if (!TG_TOKEN || !TG_CHAT_ID) {
    console.error('错误：缺少 TG_TOKEN 或 TG_CHAT_ID 环境变量');
    process.exit(1);
}

function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    const payload = JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
    });

    const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });

    req.on('error', (e) => {
        console.error('发送消息失败:', e);
    });

    req.write(payload);
    req.end();
}

const tasks = JSON.parse(fs.readFileSync('./tasks.json', 'utf-8'));
const today = new Date();
today.setHours(0, 0, 0, 0); // 抹平具体时间差异，只算天数

let alertMessages = [];

tasks.forEach(task => {
    const nextDate = new Date(task.nextDate);
    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= task.remindAdvance) {
        if (diffDays > 0) {
            alertMessages.push(`⚠️ <b>${task.name}</b> 即将到期！\n剩余天数：${diffDays}天\n到期日期：${task.nextDate}`);
        } else if (diffDays === 0) {
            alertMessages.push(`🚨 <b>${task.name}</b> 就在今天到期！请立即处理！`);
        } else {
            alertMessages.push(`❌ <b>${task.name}</b> 已经过期！\n已超期：${Math.abs(diffDays)}天`);
        }
    }
});

if (alertMessages.length > 0) {
    const finalMessage = "📋 <b>节点保活面板提醒</b> 📋\n\n" + alertMessages.join('\n\n');
    sendTelegramMessage(finalMessage);
    console.log('有任务临近到期，提醒消息已发送');
} else {
    console.log('今天所有任务状态良好，无需提醒');
}
