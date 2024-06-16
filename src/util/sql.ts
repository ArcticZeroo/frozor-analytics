import { Prisma } from '@prisma/client';
import { IError } from '../models/node.js';
import { isDuckType } from '@arcticzeroo/typeguard';

export const isUniqueConstraintViolation = (error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
        return error.code === 'P2002';
    }

    if (isDuckType<IError>(error, { code: 'string', message: 'string' })) {
        return error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed');
    }

    return false;
}
