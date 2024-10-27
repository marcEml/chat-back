import crypto from "crypto";

// Get the unique key to encrypt our object
const password: string | undefined = process.env.CRYPT_PASSWORD;

// Get the unique Initialization Vector
const iv: string | undefined = process.env.IV;

// Function to find SHA1 Hash of password key
function sha1(input: Buffer): Buffer {
    return crypto.createHash("sha1").update(input).digest();
}

// Function to get secret key for encryption and decryption using the password
function password_derive_bytes(password: string, salt: string, iterations: number, len: number): Buffer {
    let key: Buffer = Buffer.from(password + salt);
    for (let i = 0; i < iterations; i++) {
        key = sha1(key);
    }
    if (key.length < len) {
        let hx: Buffer = password_derive_bytes(password, salt, iterations - 1, 20);
        for (let counter = 1; key.length < len; ++counter) {
            key = Buffer.concat([
                key,
                sha1(Buffer.concat([Buffer.from(counter.toString()), hx])),
            ]);
        }
    }
    return Buffer.alloc(len, key);
}

// Function to encode the object
async function encode(string: string): Promise<string> {
    if (!password || !iv) {
        throw new Error("Encryption parameters not provided");
    }
    const key: Buffer = password_derive_bytes(password, "", 100, 32);
    // Initialize Cipher Object to encrypt using AES-256 Algorithm
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv.slice(0, 16));
    let encrypted: Buffer = cipher.update(string, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString("base64");
}

// Function to decode the object
async function decode(string: string): Promise<string> {
    if (!password || !iv) {
        throw new Error("Decryption parameters not provided");
    }
    const key: Buffer = password_derive_bytes(password, "", 100, 32);
    // Initialize decipher Object to decrypt using AES-256 Algorithm
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv.slice(0, 16));
    let decrypted: Buffer = decipher.update(string, "base64");
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
}

export { encode, decode };
