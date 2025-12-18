// utils/crypto.js
const ALGORITHM = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

// Генерация пары ключей
export const generateKeyPair = async () => {
    const keyPair = await crypto.subtle.generateKey(ALGORITHM, true, ["encrypt", "decrypt"]);
    return keyPair;
};

// Экспорт публичного ключа в hex
export const exportPublicKey = async (publicKey) => {
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    return Array.prototype.map.call(new Uint8Array(exported), x => ('00' + x.toString(16)).slice(-2)).join('');
};

// Импорт публичного ключа из hex
export const importPublicKey = async (hexKey) => {
    const binaryKey = Uint8Array.from(hexKey.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    return await crypto.subtle.importKey("spki", binaryKey, ALGORITHM, true, ["encrypt"]);
};

// Экспорт приватного ключа в hex
export const exportPrivateKey = async (privateKey) => {
    const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
    return Array.prototype.map.call(new Uint8Array(exported), x => ('00' + x.toString(16)).slice(-2)).join('');
};

// Импорт приватного ключа из hex
export const importPrivateKey = async (hexKey) => {
    const binaryKey = Uint8Array.from(hexKey.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    return await crypto.subtle.importKey("pkcs8", binaryKey, ALGORITHM, true, ["decrypt"]);
};

// Шифрование сообщения публичным ключом
export const encryptMessage = async (message, publicKey) => {
    const encodedMessage = new TextEncoder().encode(message);
    const encrypted = await crypto.subtle.encrypt(ALGORITHM, publicKey, encodedMessage);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

// Расшифровка сообщения приватным ключом
export const decryptMessage = async (encryptedMessage, privateKey) => {
    const encrypted = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(ALGORITHM, privateKey, encrypted);
    return new TextDecoder().decode(decrypted);
};