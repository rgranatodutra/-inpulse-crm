import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export default function validateDto(dtoClass: any) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const dtoInstance = plainToInstance(dtoClass, req.body);
        const errors: ValidationError[] = await validate(dtoInstance);

        if (errors.length > 0) {
            const validationErrors = errors.map(error => ({
                property: error.property,
                constraints: error.constraints
            }));

            return res.status(400).json({ errors: validationErrors });
        }

        req.body = dtoInstance;

        next();
    }
}