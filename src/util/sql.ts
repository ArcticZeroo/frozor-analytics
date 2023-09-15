import { IError } from '../models/node.js';

export const isUniqueConstraintViolation = (error: IError) => {
    return error.code === 'SQLITE_CONSTRAINT' && error.message && error.message.includes('UNIQUE constraint failed');
}