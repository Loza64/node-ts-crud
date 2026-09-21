import { ValidationError } from 'class-validator';

/**
 * Aplana los errores de class-validator, incluyendo los de objetos/arreglos
 * anidados (category.id, photos.0.id...). Sin esto, los errores de
 * @ValidateNested quedan en `children` y el mensaje sale vacio.
 */
export const flattenValidationErrors = (errors: ValidationError[], parentPath = ''): string[] =>
  errors.flatMap((error) => {
    const own = Object.values(error.constraints ?? {}).map((message) =>
      parentPath ? `${parentPath}.${message}` : message,
    );
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    return [...own, ...flattenValidationErrors(error.children ?? [], path)];
  });
