const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const filesToUpdate = [
    {
        path: path.join(projectRoot, 'src', 'contexts', 'AuthContext.jsx'),
        regex: /const API_BASE_URL = 'http:\/\/.*:3000\/api\/v1';/,
        replacement: (ip) => `const API_BASE_URL = 'http://${ip}:3000/api/v1';`
    },
    {
        path: path.join(projectRoot, 'src', 'services', 'authService.js'),
        regex: /const API_URL = 'http:\/\/.*:3000\/auth';/,
        replacement: (ip) => `const API_URL = 'http://${ip}:3000/auth';`
    }
];

function getIPAddress() {
    const interfaces = os.networkInterfaces();

    // 1. Try to find Wi-Fi interface first (user priority)
    for (const devName in interfaces) {
        if (devName.toLowerCase().includes('wi-fi') || devName.toLowerCase().includes('wireless')) {
            const iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === 'IPv4' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }

    // 2. Fallback to any other non-internal IPv4 (excluding WSL if possible)
    for (const devName in interfaces) {
        if (!devName.toLowerCase().includes('wsl')) {
            const iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === 'IPv4' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }

    // 3. Last resort: any IPv4
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }

    return '127.0.0.1';
}

function updateIP() {
    const ip = getIPAddress();
    console.log(`📡 IP Wi-Fi detectada: ${ip}`);

    filesToUpdate.forEach(fileInfo => {
        if (fs.existsSync(fileInfo.path)) {
            let content = fs.readFileSync(fileInfo.path, 'utf8');
            const newContent = content.replace(fileInfo.regex, fileInfo.replacement(ip));

            if (content !== newContent) {
                fs.writeFileSync(fileInfo.path, newContent, 'utf8');
                console.log(`✅ ${path.basename(fileInfo.path)} actualizado.`);
            } else {
                console.log(`ℹ️ ${path.basename(fileInfo.path)} ya tiene la IP: ${ip}`);
            }
        } else {
            console.error(`❌ No se encontró el archivo: ${fileInfo.path}`);
        }
    });
}

updateIP();
