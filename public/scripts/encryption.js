const { spawn } = require('child_process');
const { join } = require('path');
const { writeFileSync, readFileSync } = require('fs');
const spawnSync = require("child_process").spawnSync;

const encdir = join(__dirname, '../../encryption');

async function setParams(contents, key) {
    await writeFileSync(join(encdir, 'file'), contents);
    await writeFileSync(join(encdir, 'key'), `${key}`);
}

async function encrypt(contents, key) {
    await setParams(contents, key);
    return runProcess('-e');
}

async function decrypt(contents, key) {
    await setParams(Buffer.from(contents, 'base64'), key);
    return runProcess('-d');
}

function getEncrypted() {
    return readFileSync(join(encdir, 'file-enc')).toString('base64');
}
function getDecrypted() {
    return readFileSync(join(encdir, 'file-dec'));
}

function runProcess(option) {
    const isWindows = process.platform === 'win32';
    const exec_options = {
        cwd : encdir,
        timeout : 2000 ,
        killSignal : "SIGTERM",
        stdio: 'inherit',
        ...(isWindows && { shell: true })
    };

    spawnSync('encryption', [option, 'key', 'file'], exec_options);
    
    if (option == '-e') {return getEncrypted();}
    else if (option == '-d') {return getDecrypted();}
    else return null;
}


module.exports = { encrypt, decrypt };