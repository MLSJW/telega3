// utils/crypto.js
const ALGORITHM = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

export const generateKeyPair = async () => {
    const keyPair = await crypto.subtle.generateKey(ALGORITHM, true, ["encrypt", "decrypt"]);
    return keyPair;
};

export const generateAESKey = async () => {
    return await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

export const encryptAES = async (message, key) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedMessage = new TextEncoder().encode(message);
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedMessage
    );
    return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
    };
};

export const decryptAES = async (encryptedData, key) => {
    const encrypted = Uint8Array.from(atob(encryptedData.encrypted), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
    );
    return new TextDecoder().decode(decrypted);
};

export const exportAESKey = async (key) => {
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

export const importAESKey = async (base64Key) => {
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

export const exportPublicKey = async (publicKey) => {
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    const exportedAsString = btoa(String.fromCharCode(...new Uint8Array(exported)));
    const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
};

export const importPublicKey = async (pemKey) => {
    const pemContents = pemKey.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s/g, '');
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    return await crypto.subtle.importKey("spki", binaryKey, ALGORITHM, true, ["encrypt"]);
};

export const exportPrivateKey = async (privateKey) => {
    const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
    const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
};

export const importPrivateKey = async (pemKey) => {
    const pemContents = pemKey.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    return await crypto.subtle.importKey("pkcs8", binaryKey, ALGORITHM, true, ["decrypt"]);
};

export const encryptMessage = async (message, publicKey) => {
    const encodedMessage = new TextEncoder().encode(message);
    const encrypted = await crypto.subtle.encrypt(ALGORITHM, publicKey, encodedMessage);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

export const decryptMessage = async (encryptedMessage, privateKey) => {
    const encrypted = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(ALGORITHM, privateKey, encrypted);
    return new TextDecoder().decode(decrypted);
};