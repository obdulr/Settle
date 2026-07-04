import { IsNotEmpty, MinLength, ValidationOptions, registerDecorator } from 'class-validator';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

export function IsPasswordMatching(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPasswordMatchingConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isPasswordMatching', async: false })
export class IsPasswordMatchingConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    return value === object.password;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Passwords do not match';
  }
}

export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @MinLength(6)
  @IsPasswordMatching()
  confirmPassword: string;
}