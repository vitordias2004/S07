#!/usr/bin/env node

/**
 * Script de notificacao por e-mail para pipeline Jenkins.
 *
 * Uso:
 *   node script-email.js \
 *     --from "remetente@gmail.com" \
 *     --to "destino@exemplo.com" \
 *     --password "senha-de-app" \
 *     --status "SUCCESS" \
 *     --build "123" \
 *     --build-url "http://localhost:8080/job/S07/123/" \
 *     --history-file "./nginx/html/data/email-history.json"
 *
 * Variaveis de ambiente alternativas:
 *   EMAIL_REMETENTE, EMAIL_DESTINO, EMAIL_SENHA, BUILD_STATUS,
 *   BUILD_NUMBER, BUILD_URL, EMAIL_HISTORY_FILE
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const MAX_HISTORY_ITEMS = 50;

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};

    for (let i = 0; i < args.length; i += 2) {
        const key = args[i];
        const value = args[i + 1];

        if (!key || !key.startsWith('--') || value === undefined) {
            continue;
        }

        parsed[key.replace('--', '')] = value;
    }

    return parsed;
}

function createTransporter(from, password) {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: from,
            pass: password
        }
    });
}

function formatTimestamp(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'America/Sao_Paulo'
    }).format(date);
}

function generateEmailContent(status, buildNumber) {
    const statusLabel = status === 'SUCCESS' ? 'Sucesso' : 'Falha';
    const statusColor = status === 'SUCCESS' ? '#1f7a3d' : '#ad2e24';
    const timestamp = formatTimestamp(new Date());

    return {
        subject: `[DevOps S07] Pipeline #${buildNumber} - ${status}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    .header { background-color: ${statusColor}; color: white; padding: 20px; }
                    .content { padding: 20px; }
                    .status { font-size: 24px; font-weight: bold; }
                    .details { margin-top: 20px; line-height: 1.8; }
                    .footer { background-color: #f0f0f0; padding: 10px; font-size: 12px; color: #555; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Pipeline CI/CD - S07</h1>
                </div>
                <div class="content">
                    <p class="status">Status: ${statusLabel} (${status})</p>
                    <div class="details">
                        <p><strong>Build #:</strong> ${buildNumber}</p>
                        <p><strong>Data:</strong> ${timestamp}</p>
                        <p><strong>Projeto:</strong> S07 - DevOps NP2</p>
                        <p><strong>Repositorio:</strong> <a href="https://github.com/vitordias2004/S07">github.com/vitordias2004/S07</a></p>
                    </div>
                </div>
                <div class="footer">
                    <p>Este e-mail foi enviado automaticamente pelo Jenkins.</p>
                </div>
            </body>
            </html>
        `
    };
}

function maskEmail(address) {
    if (!address || !address.includes('@')) {
        return address || '';
    }

    const [localPart, domainPart] = address.split('@');
    const domainPieces = domainPart.split('.');
    const domainName = domainPieces.shift() || '';
    const tld = domainPieces.join('.');

    const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
    const visibleDomain = domainName.slice(0, Math.min(2, domainName.length));
    const maskedLocal = `${visibleLocal}${'*'.repeat(Math.max(1, localPart.length - visibleLocal.length))}`;
    const maskedDomain = `${visibleDomain}${'*'.repeat(Math.max(1, domainName.length - visibleDomain.length))}`;

    return `${maskedLocal}@${maskedDomain}${tld ? `.${tld}` : ''}`;
}

function loadHistory(historyFile) {
    if (!historyFile || !fs.existsSync(historyFile)) {
        return { updatedAt: null, emails: [] };
    }

    try {
        const raw = fs.readFileSync(historyFile, 'utf8');
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed.emails)) {
            return { updatedAt: null, emails: [] };
        }

        return {
            updatedAt: parsed.updatedAt || null,
            emails: parsed.emails
        };
    } catch (error) {
        console.warn(`Aviso: nao foi possivel ler o historico existente (${error.message}). Um novo arquivo sera criado.`);
        return { updatedAt: null, emails: [] };
    }
}

function saveHistory(historyFile, history) {
    fs.mkdirSync(path.dirname(historyFile), { recursive: true });
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

function buildHistoryEntry({
    from,
    to,
    status,
    buildNumber,
    subject,
    messageId,
    buildUrl,
    sentAt,
    deliveryStatus,
    errorMessage
}) {
    return {
        buildNumber: String(buildNumber),
        status,
        subject,
        messageId: messageId || '',
        buildUrl: buildUrl || '',
        sentAt: sentAt.toISOString(),
        sentAtLabel: formatTimestamp(sentAt),
        fromMasked: maskEmail(from),
        toMasked: maskEmail(to),
        deliveryStatus: deliveryStatus || 'UNKNOWN',
        errorMessage: errorMessage || ''
    };
}

function recordEmailHistory(historyFile, entry) {
    if (!historyFile) {
        return;
    }

    const history = loadHistory(historyFile);
    history.updatedAt = entry.sentAtLabel;
    history.emails = [entry, ...history.emails].slice(0, MAX_HISTORY_ITEMS);
    saveHistory(historyFile, history);
}

async function sendEmail(from, to, password, status, buildNumber) {
    const transporter = createTransporter(from, password);
    const emailContent = generateEmailContent(status, buildNumber);

    const mailOptions = {
        from: `Jenkins CI/CD <${from}>`,
        to,
        subject: emailContent.subject,
        html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    return { info, emailContent };
}

async function main() {
    const args = parseArgs();

    const from = args.from || process.env.EMAIL_REMETENTE;
    const to = args.to || process.env.EMAIL_DESTINO;
    const password = args.password || process.env.EMAIL_SENHA;
    const status = args.status || process.env.BUILD_STATUS || 'UNKNOWN';
    const buildNumber = args.build || process.env.BUILD_NUMBER || '0';
    const buildUrl = args['build-url'] || process.env.BUILD_URL || '';
    const historyFile = args['history-file'] || process.env.EMAIL_HISTORY_FILE || '';

    if (!from || !to || !password) {
        console.error('Erro: EMAIL_REMETENTE, EMAIL_DESTINO e EMAIL_SENHA sao obrigatorios.');
        console.error('Use --from, --to e --password ou variaveis de ambiente.');
        process.exit(1);
    }

    console.log(`Remetente: ${from}`);
    console.log(`Destinatario: ${to}`);
    console.log(`Status: ${status} | Build: #${buildNumber}`);

    try {
        const { info, emailContent } = await sendEmail(from, to, password, status, buildNumber);
        const sentAt = new Date();

        console.log(`E-mail enviado com sucesso: ${info.messageId}`);

        recordEmailHistory(
            historyFile,
            buildHistoryEntry({
                from,
                to,
                status,
                buildNumber,
                subject: emailContent.subject,
                messageId: info.messageId,
                buildUrl,
                sentAt,
                deliveryStatus: 'SENT'
            })
        );

        if (historyFile) {
            console.log(`Historico atualizado em: ${historyFile}`);
        }
    } catch (error) {
        const sentAt = new Date();
        const emailContent = generateEmailContent(status, buildNumber);

        recordEmailHistory(
            historyFile,
            buildHistoryEntry({
                from,
                to,
                status,
                buildNumber,
                subject: emailContent.subject,
                messageId: '',
                buildUrl,
                sentAt,
                deliveryStatus: 'FAILED',
                errorMessage: error.message
            })
        );

        if (historyFile) {
            console.log(`Historico atualizado com falha em: ${historyFile}`);
        }

        console.error(`Erro ao enviar e-mail: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    buildHistoryEntry,
    formatTimestamp,
    generateEmailContent,
    loadHistory,
    maskEmail,
    parseArgs,
    recordEmailHistory
};
