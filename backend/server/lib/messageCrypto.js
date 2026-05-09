import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

// Derive a consistent 32-byte key from MESSAGE_SECRET via SHA-256
const getKey = () => {
    const secret = process.env.MESSAGE_SECRET
    if (!secret) throw new Error('MESSAGE_SECRET env variable is not set')
    return crypto.createHash('sha256').update(secret).digest()
}

// Encrypt plaintext → "ivHex:ciphertextHex"
export const encrypt = (plaintext) => {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// Decrypt "ivHex:ciphertextHex" → plaintext
// Throws if the format or key is wrong — caller must catch and fall back
export const decrypt = (encryptedText) => {
    const colonIndex = encryptedText.indexOf(':')
    if (colonIndex === -1) throw new Error('not encrypted')
    const iv = Buffer.from(encryptedText.slice(0, colonIndex), 'hex')
    const encrypted = Buffer.from(encryptedText.slice(colonIndex + 1), 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
