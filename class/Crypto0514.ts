/**
 * crypto.ts
 *
 * Encrypto
 * encrypt & decrypt operation
 * updated: 2024/05/14
 **/

// define modules
import * as crypto from "crypto"; // crypto
import log4js from "log4js"; // logger

// logger configuration
log4js.configure({
  appenders: {
    system: { type: 'file', filename: '../logs/crypto.log' }
  },
  categories: {
    default: { appenders: ['system'], level: 'debug' }
  }
});
const logger: any = log4js.getLogger();

// Encrypto class
class Encrypto {

  static algorithm: string; // algorithm
  static initVector: string; // initializeVector
  static secretKey: string; // secretKey

  // construnctor
  constructor() {
    // crypto algorithm
    Encrypto.algorithm = "aes-128-ecb";
    // secret key
    Encrypto.secretKey = process.env.CRYPTO_KEY!;
    // init vector
    Encrypto.initVector = '';
  }

  // encrypt
  encrypt = async (plain: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // make ciper
        const cipher = crypto.createCipheriv(Encrypto.algorithm, Buffer.from(Encrypto.secretKey), Encrypto.initVector);
        // crypted
        const encrypted = cipher.update(plain, "utf-8", "hex") + cipher.final("hex");
        // return encrypted string
        resolve(encrypted);

      } catch (e: unknown) {
        // error
        if (e instanceof Error) {
          // error
          logger.error(e);
          reject('error');
        }
      }
    });
  }

  // decrypt 
  decrypt = async (encrypted: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // make query
        const decipher: crypto.Decipher = crypto.createDecipheriv(Encrypto.algorithm, Buffer.from(Encrypto.secretKey), Encrypto.initVector);
        // crypted
        const decrypted: string = decipher.update(encrypted, "hex", "utf-8") + decipher.final("utf-8");
        // return crypted
        resolve(decrypted);

      } catch (e: unknown) {
        // error
        logger.error(e);
        reject('error');
      }
    });
  }

  // random 
  random = async (length: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // make query
        const buf = Buffer.alloc(length);
        // return random text
        resolve(crypto.randomFillSync(buf).toString('hex'));

      } catch (e: unknown) {
        // error
        logger.error(e);
        reject('error');
      }
    });
  }
}

// export module
export default Encrypto;