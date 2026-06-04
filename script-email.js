#!/usr/bin/env node

/**
 * Script de notificação por e-mail para pipeline Jenkins
 *
 * Uso:
 *   node script-email.js \
 *     --from "remetente@gmail.com" \
 *     --to "destino@exemplo.com" \
 *     --password "senha-de-app" \
 *     --status "SUCCESS" \
 *     --build "123"
 *
 * Variáveis de ambiente alternativas:
 *   EMAIL_REMETENTE, EMAIL_DESTINO, EMAIL_SENHA, BUILD_STATUS, BUILD_NUMBER
 */

const nodemailer = require('nodemailer');

// Parse de argumentos da linha de comando
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        parsed[key] = args[i + 1];
    }
    return parsed;
}

// Configurar transporte SMTP — remetente vem de variável, nunca hardcoded
function createTransporter(from, password) {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: from,
            pass: password
        }
    });
}

// Gerar conteúdo do e-mail
function generateEmailContent(status, buildNumber) {
    const statusEmoji = status === 'SUCCESS' ? '✅' : '❌';
    const statusColor = status === 'SUCCESS' ? '#2e7d32' : '#c62828';
    const timestamp = new Date().toLocaleString('pt-BR');

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
                    <h1>${statusEmoji} Pipeline CI/CD — S07</h1>
                </div>
                <div class="content">
                    <p class="status">Status: ${status}</p>
                    <div class="details">
                        <p><strong>Build #:</strong> ${buildNumber}</p>
                        <p><strong>Data:</strong> ${timestamp}</p>
                        <p><strong>Projeto:</strong> S07 - DevOps NP2</p>
                        <p><strong>Repositório:</strong> <a href="https://github.com/vitordias2004/S07">github.com/vitordias2004/S07</a></p>
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

// Enviar e-mail
async function sendEmail(from, to, password, status, buildNumber) {
    const transporter = createTransporter(from, password);
    const emailContent = generateEmailContent(status, buildNumber);

    const mailOptions = {
        from: `Jenkins CI/CD <${from}>`,
        to: to,
        subject: emailContent.subject,
        html: emailContent.html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail enviado com sucesso: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Erro ao enviar e-mail: ${error.message}`);
        process.exit(1);
    }
}

// Main
async function main() {
    const args = parseArgs();

    const from        = args.from     || process.env.EMAIL_REMETENTE;
    const to          = args.to       || process.env.EMAIL_DESTINO;
    const password    = args.password || process.env.EMAIL_SENHA;
    const status      = args.status   || process.env.BUILD_STATUS  || 'UNKNOWN';
    const buildNumber = args.build    || process.env.BUILD_NUMBER   || '0';

    if (!from || !to || !password) {
        console.error('❌ Erro: EMAIL_REMETENTE, EMAIL_DESTINO e EMAIL_SENHA são obrigatórios');
        console.error('Use --from, --to e --password ou variáveis de ambiente');
        process.exit(1);
    }

    console.log(`📧 Remetente: ${from}`);
    console.log(`📧 Destinatário: ${to}`);
    console.log(`📊 Status: ${status} | Build: #${buildNumber}`);

    await sendEmail(from, to, password, status, buildNumber);
}

main();
