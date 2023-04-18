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

// function generateKey(length) {
//     var key = '';
//     while (length > 0) {
//         key += `${Math.floor(2*Math.random())}`;
//         length--;
//     }
//     return key;
// }

const userkey = '0010111001001000010100111110110000111011100111000011111010100001011100111001001011010010011001111111110001001001000111110011100100111110101100011011010100100111101001000010010011001010100111101111000100100011011111101101010101001011101000010011101000101110';

//encrypt('hello there!', userkey);
//console.log(getEncrypted().toString('base64'));
// SuG9523RXQgD9c8l
// const originalObj = Buffer.from('SuG9523RXQgD9c8l', 'base64');
// console.log(originalObj);
// decrypt(originalObj, userkey);

// console.log(decrypt(getEncrypted(), userkey));

module.exports = { encrypt, decrypt };