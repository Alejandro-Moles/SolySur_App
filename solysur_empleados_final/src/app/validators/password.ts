import {Directive} from '@angular/core';
import {NG_VALIDATORS, Validator, ValidatorFn, AbstractControl} from '@angular/forms';


// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function passwordValidation(): ValidatorFn{
  return (control: AbstractControl) => {
    const passwordValidationDirective = new PasswordValidationDirective();
    return passwordValidationDirective.validate(control);
  };
}


@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[passwordValidation]',
  providers: [{provide: NG_VALIDATORS, useExisting: PasswordValidationDirective, multi: true}]
})
export class PasswordValidationDirective implements Validator{
  passwordProhibidos = ['123456', '1234567', '12345678'];

    validate(control: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors{
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const pass = <string>control.value;

    if(!pass){return;}
    if(pass.length < 6){
      return {passwordValidation: {message: 'Se necesitan mas de 6 caracteres'}};
    }
    if( pass === pass.toLowerCase()){
      return {passwordValidation: {message: 'Se necesitan letras Mayusculas'}};
    }

    if( pass === pass.toUpperCase()){
      return {passwordValidation: {message: 'Se necesitan letras minusculas'}};
    }

    if(!/\d/.test(pass) ){
      return {passwordValidation: {message: 'Se necesitan digitos numericos'}};
    }

    return null;
  }
}
